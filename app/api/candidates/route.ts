import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CandidateUser = {
  id: string;
  authId: string;
  email: string;
  name: string;
  biologicalSex: string;
  romanticTarget: string;
  birthDate: Date | null;
  height: number | null;
  weight: number | null;
  hobbies: string | null;
  occupation: string | null;
  livingArea: string | null;
  meetingArea: string | null;
  bio: string | null;
  imageUrls: string[];
  createdAt: Date;
  lastLoginAt: Date | null;
};

function ageToBirthDateRange(minAge?: number, maxAge?: number) {
  const today = new Date();

  const birthDateFilter: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (maxAge !== undefined) {
    const minBirth = new Date(
      today.getFullYear() - maxAge - 1,
      today.getMonth(),
      today.getDate() + 1
    );
    birthDateFilter.gte = minBirth;
  }

  if (minAge !== undefined) {
    const maxBirth = new Date(
      today.getFullYear() - minAge,
      today.getMonth(),
      today.getDate()
    );
    birthDateFilter.lte = maxBirth;
  }

  return birthDateFilter;
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
      select: {
        id: true,
        biologicalSex: true,
        romanticTarget: true,
        livingArea: true,
        meetingArea: true,
      },
    });

    if (!me) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const swiped = await prisma.swipe.findMany({
      where: { fromUserId: currentUserId },
      select: { toUserId: true },
    });

    const swipedIds: string[] = swiped.map(
  (s: { toUserId: string }) => s.toUserId
);

    const birthDateFilter = ageToBirthDateRange(
      minAge ? Number(minAge) : undefined,
      maxAge ? Number(maxAge) : undefined
    );

    const users: CandidateUser[] = await prisma.user.findMany({
      where: {
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
        ...(meetingArea ? { meetingArea } : {}),
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
        lastLoginAt: true,
      },
    });

    const filtered: CandidateUser[] = users.filter((user: CandidateUser) => {
      const myTargetOk =
        me.romanticTarget === "両方" || me.romanticTarget === user.biologicalSex;

      const theirTargetOk =
        user.romanticTarget === "両方" ||
        user.romanticTarget === me.biologicalSex;

      return myTargetOk && theirTargetOk;
    });

    if (sort === "recent") {
      filtered.sort(
        (a: CandidateUser, b: CandidateUser) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === "active") {
      filtered.sort(
        (a: CandidateUser, b: CandidateUser) =>
          new Date(b.lastLoginAt ?? 0).getTime() -
          new Date(a.lastLoginAt ?? 0).getTime()
      );
    } else {
      filtered.sort((a: CandidateUser, b: CandidateUser) => {
        const aScore =
          (a.livingArea && a.livingArea === me.livingArea ? 2 : 0) +
          (a.meetingArea && a.meetingArea === me.meetingArea ? 1 : 0);

        const bScore =
          (b.livingArea && b.livingArea === me.livingArea ? 2 : 0) +
          (b.meetingArea && b.meetingArea === me.meetingArea ? 1 : 0);

        return bScore - aScore;
      });
    }

    return NextResponse.json(
      filtered.map((u: CandidateUser) => ({
        ...u,
        birthDate: u.birthDate ? u.birthDate.toISOString() : null,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
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