import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("currentUserId");

    if (!currentUserId) {
      return NextResponse.json(
        { error: "currentUserId が必要です" },
        { status: 400 }
      );
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId },
        ],
      },
      include: {
        user1: true,
        user2: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = matches.map((match) => {
      const partner =
        match.user1Id === currentUserId ? match.user2 : match.user1;

      return {
        id: match.id,
        createdAt: match.createdAt,
        partner,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json(
      { error: "マッチ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}