import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authId, imageUrl } = body as {
      authId?: string;
      imageUrl?: string;
    };

    if (!authId || !imageUrl) {
      return NextResponse.json(
        { error: "authId と imageUrl が必要です" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { authId },
    });

    if (!user || user.isDeleted) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { authId },
      data: {
        ageVerificationImageUrl: imageUrl,
        ageVerificationStatus: "pending",
        isAgeVerified: false,
        ageVerifiedAt: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/age-verification/submit error:", error);
    return NextResponse.json(
      { error: "年齢確認申請に失敗しました" },
      { status: 500 }
    );
  }
}