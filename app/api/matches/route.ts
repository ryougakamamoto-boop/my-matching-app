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
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      select: {
        id: true,
        createdAt: true,
        user1Id: true,
        user2Id: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const partnerIds = matches.map((match) =>
      match.user1Id === currentUserId ? match.user2Id : match.user1Id
    );

    const partners = await prisma.user.findMany({
      where: {
        id: {
          in: partnerIds,
        },
      },
      select: {
        id: true,
        name: true,
        bio: true,
        imageUrls: true,
      },
    });

    const partnerMap = new Map(partners.map((user) => [user.id, user]));

    const result = matches
      .map((match) => {
        const partnerId =
          match.user1Id === currentUserId ? match.user2Id : match.user1Id;

        const partner = partnerMap.get(partnerId);
        if (!partner) return null;

        return {
          id: match.id,
          createdAt: match.createdAt,
          partner: {
            id: partner.id,
            name: partner.name,
            bio: partner.bio,
            imageUrls: partner.imageUrls ?? [],
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "マッチ取得に失敗しました",
      },
      { status: 500 }
    );
  }
}