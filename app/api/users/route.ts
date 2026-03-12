import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "ユーザー取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const authId = String(body.authId ?? "").trim();
    const email = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim();
    const bio = body.bio ? String(body.bio).trim() : null;
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;

    if (!authId || !email || !name) {
      return NextResponse.json(
        { error: "authId, email, name は必須です" },
        { status: 400 }
      );
    }

    // まず authId で探す
    const existingByAuthId = await prisma.user.findUnique({
      where: { authId },
    });

    if (existingByAuthId) {
      const updated = await prisma.user.update({
        where: { authId },
        data: {
          email,
          name,
          bio,
          imageUrl,
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    // 次に email で探す
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          authId,
          name,
          bio,
          imageUrl,
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    // どちらもなければ新規作成
    const created = await prisma.user.create({
      data: {
        authId,
        email,
        name,
        bio,
        imageUrl,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      {
        error: "ユーザー登録に失敗しました",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}