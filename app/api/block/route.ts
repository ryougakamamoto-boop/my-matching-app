import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromUserId, toUserId } = body as {
      fromUserId?: string;
      toUserId?: string;
    };

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: "fromUserId と toUserId が必要です" },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "自分自身はブロックできません" },
        { status: 400 }
      );
    }

    await prisma.block.upsert({
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/block error:", error);
    return NextResponse.json(
      { error: "ブロックに失敗しました" },
      { status: 500 }
    );
  }
}