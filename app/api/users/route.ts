import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    console.log("POST /api/users body =", body);

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

    const existingByAuthId = await prisma.user.findUnique({
      where: { authId },
    });

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    console.log("existingByAuthId =", existingByAuthId);
    console.log("existingByEmail =", existingByEmail);

    if (existingByEmail && existingByEmail.authId !== authId) {
      return NextResponse.json(
        {
          error: "このメールアドレスのプロフィールが既に別のauthIdで存在しています",
          existingByEmail,
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.upsert({
      where: { authId },
      update: {
        email,
        name,
        bio,
        imageUrl,
      },
      create: {
        authId,
        email,
        name,
        bio,
        imageUrl,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("POST /api/users error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "Prismaエラーでユーザー登録に失敗しました",
          code: error.code,
          meta: error.meta,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "ユーザー登録に失敗しました",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}