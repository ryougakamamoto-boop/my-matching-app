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

    const updatedUser = await prisma.user.update({
      where: { authId },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      userId: updatedUser.id,
      lastLoginAt: updatedUser.lastLoginAt,
    });
  } catch (error) {
    console.error("POST /api/users/login error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ログイン日時の更新に失敗しました",
      },
      { status: 500 }
    );
  }
}