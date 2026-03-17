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
        user1: {
          select: {
            id: true,
            name: true,
            bio: true,
            imageUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            bio: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type MatchItem = (typeof matches)[number];

const result = matches.map((match: MatchItem) => {
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
      { error: "マッチ取得に失敗しました" },
      { status: 500 }
    );
  }
}