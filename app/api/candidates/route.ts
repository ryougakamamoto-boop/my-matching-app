import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getAllowedTargetSexes(romanticTarget: string) {
  if (romanticTarget === "男") return ["男"];
  if (romanticTarget === "女") return ["女"];
  if (romanticTarget === "両方") return ["男", "女"];
  return [];
}

function getAllowedPartnerTargets(mySex: string) {
  return [mySex, "両方"];
}

const PREF_NEAR_MAP: Record<string, string[]> = {
  北海道: [],
  青森県: ["秋田県", "岩手県", "北海道"],
  岩手県: ["青森県", "秋田県", "宮城県"],
  宮城県: ["岩手県", "秋田県", "山形県", "福島県"],
  秋田県: ["青森県", "岩手県", "宮城県", "山形県"],
  山形県: ["秋田県", "宮城県", "福島県", "新潟県"],
  福島県: ["宮城県", "山形県", "新潟県", "栃木県", "茨城県"],
  茨城県: ["福島県", "栃木県", "埼玉県", "千葉県"],
  栃木県: ["福島県", "茨城県", "群馬県", "埼玉県"],
  群馬県: ["栃木県", "埼玉県", "長野県", "新潟県"],
  埼玉県: ["群馬県", "栃木県", "茨城県", "千葉県", "東京都", "山梨県", "長野県"],
  千葉県: ["茨城県", "埼玉県", "東京都", "神奈川県"],
  東京都: ["埼玉県", "千葉県", "神奈川県", "山梨県"],
  神奈川県: ["東京都", "千葉県", "山梨県", "静岡県"],
  新潟県: ["山形県", "福島県", "群馬県", "長野県", "富山県"],
  富山県: ["新潟県", "長野県", "岐阜県", "石川県"],
  石川県: ["富山県", "福井県", "岐阜県"],
  福井県: ["石川県", "岐阜県", "滋賀県", "京都府"],
  山梨県: ["東京都", "神奈川県", "埼玉県", "長野県", "静岡県"],
  長野県: ["群馬県", "埼玉県", "山梨県", "新潟県", "富山県", "岐阜県", "静岡県", "愛知県"],
  岐阜県: ["富山県", "石川県", "福井県", "長野県", "愛知県", "三重県", "滋賀県"],
  静岡県: ["神奈川県", "山梨県", "長野県", "愛知県"],
  愛知県: ["長野県", "岐阜県", "静岡県", "三重県"],
  三重県: ["岐阜県", "愛知県", "滋賀県", "京都府", "奈良県", "和歌山県"],
  滋賀県: ["福井県", "岐阜県", "三重県", "京都府"],
  京都府: ["福井県", "三重県", "滋賀県", "大阪府", "兵庫県", "奈良県"],
  大阪府: ["京都府", "兵庫県", "奈良県", "和歌山県"],
  兵庫県: ["京都府", "大阪府", "岡山県", "鳥取県"],
  奈良県: ["三重県", "京都府", "大阪府", "和歌山県"],
  和歌山県: ["三重県", "大阪府", "奈良県"],
  鳥取県: ["兵庫県", "岡山県", "島根県", "広島県"],
  島根県: ["鳥取県", "広島県", "山口県"],
  岡山県: ["兵庫県", "鳥取県", "広島県", "香川県"],
  広島県: ["鳥取県", "島根県", "岡山県", "山口県", "愛媛県"],
  山口県: ["島根県", "広島県", "福岡県"],
  徳島県: ["香川県", "愛媛県", "高知県", "兵庫県"],
  香川県: ["岡山県", "徳島県", "愛媛県"],
  愛媛県: ["香川県", "徳島県", "高知県", "広島県"],
  高知県: ["徳島県", "愛媛県"],
  福岡県: ["山口県", "佐賀県", "熊本県", "大分県"],
  佐賀県: ["福岡県", "長崎県"],
  長崎県: ["佐賀県", "熊本県"],
  熊本県: ["福岡県", "長崎県", "大分県", "宮崎県", "鹿児島県"],
  大分県: ["福岡県", "熊本県", "宮崎県"],
  宮崎県: ["熊本県", "大分県", "鹿児島県"],
  鹿児島県: ["熊本県", "宮崎県"],
  沖縄県: [],
};

function isSameOrNear(from?: string | null, to?: string | null) {
  if (!from || !to) return false;
  if (from === to) return true;
  return (PREF_NEAR_MAP[from] ?? []).includes(to);
}

function getMutualCandidateScore(params: {
  myLivingArea?: string | null;
  myMeetingArea?: string | null;
  candidateLivingArea?: string | null;
  candidateMeetingArea?: string | null;
}) {
  const {
    myLivingArea,
    myMeetingArea,
    candidateLivingArea,
    candidateMeetingArea,
  } = params;

  let score = 0;

  if (myMeetingArea && candidateLivingArea) {
    if (myMeetingArea === candidateLivingArea) {
      score += 100;
    } else if (isSameOrNear(myMeetingArea, candidateLivingArea)) {
      score += 60;
    }
  }

  if (candidateMeetingArea && myLivingArea) {
    if (candidateMeetingArea === myLivingArea) {
      score += 100;
    } else if (isSameOrNear(candidateMeetingArea, myLivingArea)) {
      score += 60;
    }
  }

  if (myMeetingArea && candidateMeetingArea) {
    if (myMeetingArea === candidateMeetingArea) {
      score += 40;
    } else if (isSameOrNear(myMeetingArea, candidateMeetingArea)) {
      score += 20;
    }
  }

  if (myLivingArea && candidateLivingArea) {
    if (myLivingArea === candidateLivingArea) {
      score += 20;
    } else if (isSameOrNear(myLivingArea, candidateLivingArea)) {
      score += 10;
    }
  }

  return score;
}

function shuffleArray<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("currentUserId");

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
        { error: "現在のユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const myTargetSexes = getAllowedTargetSexes(me.romanticTarget);
    const partnerAllowedTargets = getAllowedPartnerTargets(me.biologicalSex);

    const sentLikes = await prisma.like.findMany({
      where: { fromUserId: currentUserId },
      select: { toUserId: true },
    });

    const matched = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const excludedUserIds = new Set<string>();
    excludedUserIds.add(currentUserId);

    for (const like of sentLikes) {
      excludedUserIds.add(like.toUserId);
    }

    for (const match of matched) {
      excludedUserIds.add(match.user1Id);
      excludedUserIds.add(match.user2Id);
    }

    const candidates = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(excludedUserIds),
        },
        biologicalSex: {
          in: myTargetSexes,
        },
        romanticTarget: {
          in: partnerAllowedTargets,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type Candidate = (typeof candidates)[number];

    type CandidateWithScore = Candidate & {
      mutualScore: number;
    };

    const scoredCandidates: CandidateWithScore[] = candidates.map(
      (candidate: Candidate): CandidateWithScore => ({
        ...candidate,
        mutualScore: getMutualCandidateScore({
          myLivingArea: me.livingArea,
          myMeetingArea: me.meetingArea,
          candidateLivingArea: candidate.livingArea,
          candidateMeetingArea: candidate.meetingArea,
        }),
      })
    );

    const grouped = new Map<number, CandidateWithScore[]>();

    for (const candidate of scoredCandidates) {
      const list = grouped.get(candidate.mutualScore) ?? [];
      list.push(candidate);
      grouped.set(candidate.mutualScore, list);
    }

    const sortedScores = Array.from(grouped.keys()).sort((a, b) => b - a);

    const sortedCandidates: CandidateWithScore[] = sortedScores.flatMap(
      (score) => shuffleArray(grouped.get(score) ?? [])
    );

    const responseCandidates = sortedCandidates.map(
      ({ mutualScore, ...candidate }) => candidate
    );

    return NextResponse.json(responseCandidates);
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return NextResponse.json(
      { error: "候補取得に失敗しました" },
      { status: 500 }
    );
  }
}