import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authId = searchParams.get("authId");

    if (!authId) {
      return NextResponse.json({ error: "authIdがありません" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        authId,
        isDeleted: false,
      },
      select: {
        id: true,
        authId: true,
        name: true,
        age: true,
        bio: true,
        gender: true,
        lookingFor: true,
        image: true,
        isDeleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}