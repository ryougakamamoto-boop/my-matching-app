import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId が必要です" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { matchId },
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "メッセージ取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const matchId = String(body.matchId ?? "").trim();
    const senderId = String(body.senderId ?? "").trim();
    const text = String(body.text ?? "").trim();

    if (!matchId || !senderId || !text) {
      return NextResponse.json(
        { error: "matchId, senderId, text は必須です" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId,
        text,
      },
      include: {
        sender: true,
      },
    });

    return NextResponse.json(message, { status: 201 });
    } catch (error) {
  console.error("GET /api/messages error:", error);
  return NextResponse.json(
    {
      error: "メッセージ取得に失敗しました",
      detail: error instanceof Error ? error.message : "unknown error",
    },
    { status: 500 }
  );
}
}