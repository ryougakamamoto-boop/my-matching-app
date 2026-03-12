import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fromUserId = String(body.fromUserId ?? "").trim();
    const toUserId = String(body.toUserId ?? "").trim();
    const action = String(body.action ?? "").trim(); // like or skip

    if (!fromUserId || !toUserId || !action) {
      return NextResponse.json(
        { error: "fromUserId, toUserId, action は必須です" },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "自分自身にはスワイプできません" },
        { status: 400 }
      );
    }

    if (action !== "like" && action !== "skip") {
      return NextResponse.json(
        { error: "action は like または skip です" },
        { status: 400 }
      );
    }

    if (action === "skip") {
      return NextResponse.json({ ok: true, matched: false });
    }

    // 既に like 済みならそのまま返す
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

    // 相手からの like があるか確認
    const reverseLike = await prisma.like.findFirst({
      where: {
        fromUserId: toUserId,
        toUserId: fromUserId,
      },
    });

    if (!reverseLike) {
      return NextResponse.json({ ok: true, matched: false });
    }

    // 既存マッチ確認
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: fromUserId, user2Id: toUserId },
          { user1Id: toUserId, user2Id: fromUserId },
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

    const match = await prisma.match.create({
      data: {
        user1Id: fromUserId,
        user2Id: toUserId,
      },
    });

    return NextResponse.json({
      ok: true,
      matched: true,
      matchId: match.id,
    });
  } catch (error) {
    console.error("POST /api/swipe error:", error);
    return NextResponse.json(
      { error: "スワイプ処理に失敗しました" },
      { status: 500 }
    );
  }
}