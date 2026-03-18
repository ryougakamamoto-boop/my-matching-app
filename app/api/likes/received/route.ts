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
      orderBy: {
        createdAt: "desc",
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            bio: true,
            imageUrls: true,
          },
        },
      },
    });

    const mySwipes = await prisma.swipe.findMany({
      where: {
        fromUserId: currentUserId,
      },
      select: {
        toUserId: true,
      },
    });

    const alreadySwipedUserIds = new Set(
      mySwipes.map((swipe) => swipe.toUserId)
    );

    console.log("currentUserId:", currentUserId);
    console.log(
      "likes:",
      likes.map((l) => ({
        fromUserId: l.fromUserId,
        toUserId: l.toUserId,
      }))
    );
    console.log("mySwipes:", mySwipes);
    console.log("alreadySwipedUserIds:", [...alreadySwipedUserIds]);

    const filteredLikes = likes.filter(
      (like) => !alreadySwipedUserIds.has(like.fromUserId)
    );

    console.log(
      "filteredLikes:",
      filteredLikes.map((l) => ({
        fromUserId: l.fromUserId,
        toUserId: l.toUserId,
      }))
    );

    const result = filteredLikes.map((like) => ({
      id: like.id,
      createdAt: like.createdAt,
      fromUser: {
        id: like.fromUser.id,
        name: like.fromUser.name,
        bio: like.fromUser.bio,
        imageUrls: like.fromUser.imageUrls ?? [],
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/likes/received error:", error);
    return NextResponse.json(
      { error: "受信いいね取得に失敗しました" },
      { status: 500 }
    );
  }
}