import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      authId,
      email,
      name,
      biologicalSex,
      romanticTarget,
      birthDate,
      bio,
      imageUrls,
      height,
      weight,
      hobbies,
      occupation,
      livingArea,
      meetingArea,
    } = body as {
      authId?: string;
      email?: string;
      name?: string;
      biologicalSex?: string;
      romanticTarget?: string;
      birthDate?: string | null;
      bio?: string | null;
      imageUrls?: string[];
      height?: number | null;
      weight?: number | null;
      hobbies?: string | null;
      occupation?: string | null;
      livingArea?: string | null;
      meetingArea?: string | null;
    };

    if (!authId || !email || !name || !biologicalSex || !romanticTarget) {
      return NextResponse.json(
        {
          error:
            "authId, email, name, biologicalSex, romanticTarget が必要です",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { authId },
    });

    if (!existingUser) {
      const createdUser = await prisma.user.create({
        data: {
          authId,
          email,
          name,
          biologicalSex,
          romanticTarget,
          birthDate: birthDate ? new Date(birthDate) : null,
          bio: bio ?? null,
          imageUrls: imageUrls ?? [],
          height: typeof height === "number" ? height : null,
          weight: typeof weight === "number" ? weight : null,
          hobbies: hobbies ?? null,
          occupation: occupation ?? null,
          livingArea: livingArea ?? null,
          meetingArea: meetingArea ?? null,
        },
      });

      return NextResponse.json(createdUser);
    }

    const updatedUser = await prisma.user.update({
      where: { authId },
      data: {
        email,
        name,
        biologicalSex,
        romanticTarget,
        // birthDate は更新しない（登録後変更不可）
        bio: bio ?? null,
        imageUrls: imageUrls ?? [],
        height: typeof height === "number" ? height : null,
        weight: typeof weight === "number" ? weight : null,
        hobbies: hobbies ?? null,
        occupation: occupation ?? null,
        livingArea: livingArea ?? null,
        meetingArea: meetingArea ?? null,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ユーザー保存に失敗しました",
      },
      { status: 500 }
    );
  }
}