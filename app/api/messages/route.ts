import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    const currentUserId = searchParams.get("currentUserId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId が必要です" },
        { status: 400 }
      );
    }

    if (!currentUserId) {
      return NextResponse.json(
        { error: "currentUserId が必要です" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: "マッチが見つかりません" },
        { status: 404 }
      );
    }

    const otherUserId =
      match.user1Id === currentUserId ? match.user2Id : match.user1Id;

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { fromUserId: currentUserId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: currentUserId },
        ],
      },
    });

    if (block) {
      return NextResponse.json([], { status: 200 });
    }

    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      messages.map((msg) => ({
        id: msg.id,
        text: msg.text,
        createdAt: msg.createdAt.toISOString(),
        senderId: msg.senderId,
        sender: msg.sender,
      }))
    );
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
    const { matchId, senderId, text } = body as {
      matchId?: string;
      senderId?: string;
      text?: string;
    };

    if (!matchId || !senderId || !text?.trim()) {
      return NextResponse.json(
        { error: "matchId, senderId, text が必要です" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: "マッチが見つかりません" },
        { status: 404 }
      );
    }

    const otherUserId =
      match.user1Id === senderId ? match.user2Id : match.user1Id;

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { fromUserId: senderId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: senderId },
        ],
      },
    });

    if (block) {
      return NextResponse.json(
        { error: "ブロック中のため送信できません" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId,
        text: text.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: message.id,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      sender: message.sender,
    });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "メッセージ送信に失敗しました" },
      { status: 500 }
    );
  }
}