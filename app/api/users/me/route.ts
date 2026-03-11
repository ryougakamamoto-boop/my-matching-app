import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authId = searchParams.get("authId");

    if (!authId) {
      return NextResponse.json({ error: "authId が必要です" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { authId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "プロフィール情報が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json(
      { error: "プロフィール取得に失敗しました" },
      { status: 500 }
    );
  }
}