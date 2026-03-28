import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authId } = body as { authId?: string };

    if (!authId) {
      return NextResponse.json(
        { error: "authId が必要です" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { authId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (!user.isDeleted) {
      return NextResponse.json({ ok: true, restored: false, user });
    }

    const restoredUser = await prisma.user.update({
      where: { authId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      restored: true,
      user: restoredUser,
    });
  } catch (error) {
    console.error("POST /api/users/restore error:", error);
    return NextResponse.json(
      { error: "アカウント復元に失敗しました" },
      { status: 500 }
    );
  }
}