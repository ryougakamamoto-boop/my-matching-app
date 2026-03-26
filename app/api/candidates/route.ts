import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function ageToBirthDateRange(minAge?: number, maxAge?: number) {
  const today = new Date();

  const range: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (maxAge !== undefined) {
    const youngest = new Date(today);
    youngest.setFullYear(today.getFullYear() - maxAge - 1);
    youngest.setDate(youngest.getDate() + 1);
    range.gte = youngest;
  }

  if (minAge !== undefined) {
    const oldest = new Date(today);
    oldest.setFullYear(today.getFullYear() - minAge);
    range.lte = oldest;
  }

  return range;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const currentUserId = searchParams.get("currentUserId");
    const sort = searchParams.get("sort") ?? "distance";
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const minHeight = searchParams.get("minHeight");
    const maxHeight = searchParams.get("maxHeight");
    const livingArea = searchParams.get("livingArea");
    const meetingArea = searchParams.get("meetingArea");

    if (!currentUserId) {
      return NextResponse.json(
        { error: "currentUserId が必要です" },
        { status: 400 }
      );
    }

    const me = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!me || me.isDeleted) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const swiped = await prisma.swipe.findMany({
      where: { fromUserId: currentUserId },
      select: { toUserId: true },
    });

    const swipedIds = swiped.map((s) => s.toUserId);

    const birthDateFilter = ageToBirthDateRange(
      minAge ? Number(minAge) : undefined,
      maxAge ? Number(maxAge) : undefined
    );

    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        id: {
          not: currentUserId,
          notIn: swipedIds,
        },

        ...(Object.keys(birthDateFilter).length > 0
          ? { birthDate: birthDateFilter }
          : {}),

        ...(minHeight || maxHeight
          ? {
              height: {
                ...(minHeight ? { gte: Number(minHeight) } : {}),
                ...(maxHeight ? { lte: Number(maxHeight) } : {}),
              },
            }
          : {}),

        ...(livingArea ? { livingArea } : {}),

        ...(meetingArea
          ? {
              meetingArea: {
                has: meetingArea,
              },
            }
          : {}),
      },
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

    const filtered = users.filter((user) => {
      const myTargetOk =
        me.romanticTarget === "両方" ||
        me.romanticTarget === user.biologicalSex;

      const theirTargetOk =
        user.romanticTarget === "両方" ||
        user.romanticTarget === me.biologicalSex;

      return myTargetOk && theirTargetOk;
    });

    if (sort === "recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json(
      filtered.map((u) => ({
        ...u,
        birthDate: u.birthDate ? u.birthDate.toISOString() : null,
      }))
    );
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return NextResponse.json(
      { error: "候補取得に失敗しました" },
      { status: 500 }
    );
  }
}