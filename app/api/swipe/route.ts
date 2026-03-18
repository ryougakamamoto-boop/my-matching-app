import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromUserId, toUserId, action } = body as {
      fromUserId?: string;
      toUserId?: string;
      action?: "like" | "skip";
    };

    if (!fromUserId || !toUserId || !action) {
      return NextResponse.json(
        { error: "fromUserId, toUserId, action が必要です" },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "自分自身にはスワイプできません" },
        { status: 400 }
      );
    }

    if (action === "skip") {
      return NextResponse.json({ ok: true, matched: false });
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        fromUserId,
        toUserId,
      },
    });

    if (!existingLike) {
      await prisma.like.create({
        data: {
          fromUserId,
          toUserId,
        },
      });
    }

    const reverseLike = await prisma.like.findFirst({
      where: {
        fromUserId: toUserId,
        toUserId: fromUserId,
      },
    });

    if (!reverseLike) {
      return NextResponse.json({
        ok: true,
        matched: false,
      });
    }

    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          {
            user1Id: fromUserId,
            user2Id: toUserId,
          },
          {
            user1Id: toUserId,
            user2Id: fromUserId,
          },
        ],
      },
    });

    if (existingMatch) {
      return NextResponse.json({
        ok: true,
        matched: true,
        matchId: existingMatch.id,
      });
    }

    const newMatch = await prisma.match.create({
      data: {
        user1Id: fromUserId,
        user2Id: toUserId,
      },
    });

    return NextResponse.json({
      ok: true,
      matched: true,
      matchId: newMatch.id,
    });
  } catch (error) {
    console.error("POST /api/swipe error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "スワイプ処理に失敗しました",
      },
      { status: 500 }
    );
  }
}