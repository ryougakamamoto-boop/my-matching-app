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

    const likes = await prisma.like.findMany({
      where: {
        toUserId: currentUserId,
      },
      include: {
        fromUser: {
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

    return NextResponse.json(likes);
  } catch (error) {
    console.error("GET /api/likes/received error:", error);
    return NextResponse.json(
      { error: "受信いいね取得に失敗しました" },
      { status: 500 }
    );
  }
}