import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authId = searchParams.get("authId");

    if (!authId) {
      return NextResponse.json(
        { error: "authId が必要です" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { authId },
      select: {
        id: true,
        authId: true,
        email: true,
        name: true,
        biologicalSex: true,
        romanticTarget: true,
        birthDate: true,
        height: true,
        weight: true,
        hobbies: true,
        occupation: true,
        livingArea: true,
        meetingArea: true,
        bio: true,
        imageUrls: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      birthDate: user.birthDate ? user.birthDate.toISOString() : null,
      imageUrls: user.imageUrls ?? [],
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ユーザー取得に失敗しました",
      },
      { status: 500 }
    );
  }
}