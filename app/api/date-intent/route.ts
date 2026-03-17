import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, userId } = body as {
      matchId?: string;
      userId?: string;
    };

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: "matchId と userId が必要です" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        user1WantsMeet: true,
        user2WantsMeet: true,
        meetMatchedAt: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "マッチが見つかりません" },
        { status: 404 }
      );
    }

    if (userId !== match.user1Id && userId !== match.user2Id) {
      return NextResponse.json(
        { error: "このマッチに参加していません" },
        { status: 403 }
      );
    }

    const nextUser1 = userId === match.user1Id ? true : match.user1WantsMeet;
    const nextUser2 = userId === match.user2Id ? true : match.user2WantsMeet;
    const bothReady = nextUser1 && nextUser2;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        user1WantsMeet: nextUser1,
        user2WantsMeet: nextUser2,
        meetMatchedAt: bothReady ? match.meetMatchedAt ?? new Date() : null,
      },
      select: {
        id: true,
        user1WantsMeet: true,
        user2WantsMeet: true,
        meetMatchedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      bothReady,
      match: updated,
    });
  } catch (error) {
    console.error("POST /api/date-intent error:", error);
    return NextResponse.json(
      { error: "会いたい意思の更新に失敗しました" },
      { status: 500 }
    );
  }
}