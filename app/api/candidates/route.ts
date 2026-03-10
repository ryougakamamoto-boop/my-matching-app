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

    // 自分がいいねした相手を取得
    const likes = await prisma.like.findMany({
      where: {
        fromUserId: currentUserId,
      },
      select: {
        toUserId: true,
      },
    });

    const excludedIds = likes.map((like) => like.toUserId);

    // 自分自身も除外
    excludedIds.push(currentUserId);

    const candidates = await prisma.user.findMany({
      where: {
        id: {
          notIn: excludedIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return NextResponse.json(
      { error: "候補取得に失敗しました" },
      { status: 500 }
    );
  }
}