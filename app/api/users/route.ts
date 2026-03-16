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
    const biologicalSex = String(body.biologicalSex ?? "").trim();
    const romanticTarget = String(body.romanticTarget ?? "").trim();

    const bio = body.bio ? String(body.bio).trim() : null;
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    const hobbies = body.hobbies ? String(body.hobbies).trim() : null;
    const occupation = body.occupation ? String(body.occupation).trim() : null;
    const livingArea = body.livingArea ? String(body.livingArea).trim() : null;
    const meetingArea = body.meetingArea ? String(body.meetingArea).trim() : null;

    const height =
      body.height !== undefined && body.height !== null && body.height !== ""
        ? Number(body.height)
        : null;

    const weight =
      body.weight !== undefined && body.weight !== null && body.weight !== ""
        ? Number(body.weight)
        : null;

    if (!authId || !email || !name || !biologicalSex || !romanticTarget) {
      return NextResponse.json(
        {
          error:
            "authId, email, name, biologicalSex, romanticTarget は必須です",
        },
        { status: 400 }
      );
    }

    const existingByAuthId = await prisma.user.findUnique({
      where: { authId },
    });

    if (existingByAuthId) {
      const updated = await prisma.user.update({
        where: { authId },
        data: {
          email,
          bio,
          imageUrl,
          height,
          weight,
          hobbies,
          occupation,
          livingArea,
          meetingArea,
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          authId,
          bio,
          imageUrl,
          height,
          weight,
          hobbies,
          occupation,
          livingArea,
          meetingArea,
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    const created = await prisma.user.create({
      data: {
        authId,
        email,
        name,
        biologicalSex,
        romanticTarget,
        bio,
        imageUrl,
        height,
        weight,
        hobbies,
        occupation,
        livingArea,
        meetingArea,
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