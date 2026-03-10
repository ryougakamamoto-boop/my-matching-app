import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function sortUserIds(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fromUserId = String(body.fromUserId ?? "");
    const toUserId = String(body.toUserId ?? "");
    const action = String(body.action ?? "");

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: "ユーザーIDが不足しています" }, { status: 400 });
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "自分自身には操作できません" }, { status: 400 });
    }

    if (!["like", "skip"].includes(action)) {
      return NextResponse.json({ error: "actionが不正です" }, { status: 400 });
    }

    if (action === "skip") {
      return NextResponse.json({ skipped: true, matched: false });
    }

    await prisma.like.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
      update: {},
      create: {
        fromUserId,
        toUserId,
      },
    });

    const reverseLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    let matched = false;

    if (reverseLike) {
      const [user1Id, user2Id] = sortUserIds(fromUserId, toUserId);

      await prisma.match.upsert({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id,
          },
        },
        update: {},
        create: {
          user1Id,
          user2Id,
        },
      });

      matched = true;
    }

    return NextResponse.json({ liked: true, matched });
  } catch (error) {
    console.error("POST /api/swipe error:", error);
    return NextResponse.json({ error: "スワイプ処理に失敗しました" }, { status: 500 });
  }
}