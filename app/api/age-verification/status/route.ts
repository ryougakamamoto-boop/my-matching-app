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
        isAgeVerified: true,
        ageVerificationStatus: true,
        ageVerificationImageUrl: true,
        ageVerifiedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/age-verification/status error:", error);
    return NextResponse.json(
      { error: "年齢確認状態の取得に失敗しました" },
      { status: 500 }
    );
  }
}