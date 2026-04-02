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

    const updated = await prisma.user.update({
      where: { authId },
      data: {
        isAgeVerified: true,
        ageVerificationStatus: "approved",
        ageVerifiedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/age-verification/approve error:", error);
    return NextResponse.json(
      { error: "年齢確認承認に失敗しました" },
      { status: 500 }
    );
  }
}