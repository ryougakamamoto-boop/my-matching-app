import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getAllowedTargetSexes(romanticTarget: string) {
  if (romanticTarget === "男") return ["男"];
  if (romanticTarget === "女") return ["女"];
  if (romanticTarget === "両方") return ["男", "女"];
  return [];
}

function getAllowedPartnerTargets(mySex: string) {
  return [mySex, "両方"];
}

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

    const me = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        biologicalSex: true,
        romanticTarget: true,
      },
    });

    if (!me) {
      return NextResponse.json(
        { error: "現在のユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const myTargetSexes = getAllowedTargetSexes(me.romanticTarget);
    const partnerAllowedTargets = getAllowedPartnerTargets(me.biologicalSex);

    const sentLikes = await prisma.like.findMany({
      where: { fromUserId: currentUserId },
      select: { toUserId: true },
    });

    const matched = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const excludedUserIds = new Set<string>();
    excludedUserIds.add(currentUserId);

    for (const like of sentLikes) {
      excludedUserIds.add(like.toUserId);
    }

    for (const match of matched) {
      excludedUserIds.add(match.user1Id);
      excludedUserIds.add(match.user2Id);
    }

    const candidates = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(excludedUserIds),
        },
        biologicalSex: {
          in: myTargetSexes,
        },
        romanticTarget: {
          in: partnerAllowedTargets,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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