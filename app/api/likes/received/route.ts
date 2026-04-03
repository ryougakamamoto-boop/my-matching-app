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

    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ fromUserId: currentUserId }, { toUserId: currentUserId }],
      },
      select: {
        fromUserId: true,
        toUserId: true,
      },
    });

    const blockedUserIds = blocks.map((b) =>
      b.fromUserId === currentUserId ? b.toUserId : b.fromUserId
    );

    const likes = await prisma.like.findMany({
      where: {
        toUserId: currentUserId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: true,
      },
    });

    const visibleLikes = likes
      .filter((item) => !blockedUserIds.includes(item.fromUser.id))
      .map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        fromUser: {
          id: item.fromUser.id,
          name: item.fromUser.name,
          bio: item.fromUser.bio,
          imageUrls: item.fromUser.imageUrls ?? [],
          birthDate: item.fromUser.birthDate
            ? item.fromUser.birthDate.toISOString()
            : null,
        },
      }));

    return NextResponse.json(visibleLikes);
  } catch (error) {
    console.error("GET /api/likes/received error:", error);
    return NextResponse.json(
      { error: "受信いいね取得に失敗しました" },
      { status: 500 }
    );
  }
}