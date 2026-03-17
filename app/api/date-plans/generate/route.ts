import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Budget = "low" | "medium" | "high";
type Duration = "short" | "medium" | "long";
type Mood = "quiet" | "lively";
type TimeOfDay = "day" | "night";

type GeneratedPlan = {
  title: string;
  summary: string;
  keyword: string;
  budgetLabel: string;
  durationLabel: string;
};

type HotPepperShop = {
  name: string;
  address: string;
  catch: string;
  budget: { name?: string };
  urls: { pc?: string };
  photo?: { pc?: { l?: string } };
};

function budgetToHotPepperCode(budget: Budget) {
  if (budget === "low") return "B009"; // 〜1500円あたり
  if (budget === "medium") return "B010"; // 1501〜2000円あたり
  return "B012"; // 3001〜4000円あたり
}

function budgetLabel(budget: Budget) {
  if (budget === "low") return "1000〜2000円";
  if (budget === "medium") return "2000〜4000円";
  return "4000円以上";
}

function durationLabel(duration: Duration) {
  if (duration === "short") return "1〜2時間";
  if (duration === "medium") return "2〜3時間";
  return "3〜4時間";
}

function pickArea(
  myMeetingArea?: string | null,
  partnerMeetingArea?: string | null,
  myLivingArea?: string | null,
  partnerLivingArea?: string | null
) {
  return (
    myMeetingArea ||
    partnerMeetingArea ||
    myLivingArea ||
    partnerLivingArea ||
    "東京都"
  );
}

async function generatePlanIdeas(params: {
  area: string;
  budget: Budget;
  duration: Duration;
  mood: Mood;
  timeOfDay: TimeOfDay;
  myHobbies?: string | null;
  partnerHobbies?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が未設定です");
  }

  const prompt = `
あなたは初対面の飲食店デートプランを提案するアシスタントです。
JSONのみで返してください。

条件:
- 地域: ${params.area}
- 予算: ${budgetLabel(params.budget)}
- 所要時間: ${durationLabel(params.duration)}
- 雰囲気: ${params.mood === "quiet" ? "静かめ" : "にぎやか"}
- 時間帯: ${params.timeOfDay === "day" ? "昼" : "夜"}
- 趣味1: ${params.myHobbies ?? ""}
- 趣味2: ${params.partnerHobbies ?? ""}

出力:
{
  "plans": [
    {
      "title": "string",
      "summary": "string",
      "keyword": "Hot Pepper検索に使いやすい短い日本語キーワード",
      "budgetLabel": "string",
      "durationLabel": "string"
    }
  ]
}

ルール:
- 3件返す
- 必ず飲食店デート中心
- keyword は「カフェ」「ランチ」「居酒屋」「夜カフェ」など短く
- 存在しない店名は出さない
`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "date_plan_schema",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              plans: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    keyword: { type: "string" },
                    budgetLabel: { type: "string" },
                    durationLabel: { type: "string" },
                  },
                  required: [
                    "title",
                    "summary",
                    "keyword",
                    "budgetLabel",
                    "durationLabel",
                  ],
                },
              },
            },
            required: ["plans"],
          },
        },
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("OpenAI responses error:", data);
    throw new Error("AIプラン生成に失敗しました");
  }

  const jsonText =
    data.output_text ??
    data.output?.[0]?.content?.[0]?.text ??
    data.output?.[0]?.content?.[0]?.value;

  const parsed = JSON.parse(jsonText) as { plans: GeneratedPlan[] };
  return parsed.plans;
}

async function searchHotPepper(params: {
  area: string;
  keyword: string;
  budget: Budget;
}) {
  const key = process.env.HOTPEPPER_API_KEY;
  if (!key) {
    throw new Error("HOTPEPPER_API_KEY が未設定です");
  }

  const url = new URL("https://webservice.recruit.co.jp/hotpepper/gourmet/v1/");
  url.searchParams.set("key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("count", "3");
  url.searchParams.set("keyword", `${params.area} ${params.keyword}`);
  url.searchParams.set("budget", budgetToHotPepperCode(params.budget));

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    console.error("Hot Pepper error:", data);
    throw new Error("Hot Pepper検索に失敗しました");
  }

  return (data.results?.shop ?? []) as HotPepperShop[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      matchId,
      userId,
      budget,
      duration,
      mood,
      timeOfDay,
    } = body as {
      matchId?: string;
      userId?: string;
      budget?: Budget;
      duration?: Duration;
      mood?: Mood;
      timeOfDay?: TimeOfDay;
    };

    if (!matchId || !userId || !budget || !duration || !mood || !timeOfDay) {
      return NextResponse.json(
        { error: "必要な条件が不足しています" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            livingArea: true,
            meetingArea: true,
            hobbies: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            livingArea: true,
            meetingArea: true,
            hobbies: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "マッチが見つかりません" },
        { status: 404 }
      );
    }

    if (!match.meetMatchedAt) {
      return NextResponse.json(
        { error: "まだお互いに会いたい状態ではありません" },
        { status: 403 }
      );
    }

    const me = match.user1.id === userId ? match.user1 : match.user2;
    const partner = match.user1.id === userId ? match.user2 : match.user1;

    const area = pickArea(
      me.meetingArea,
      partner.meetingArea,
      me.livingArea,
      partner.livingArea
    );

    const ideas = await generatePlanIdeas({
      area,
      budget,
      duration,
      mood,
      timeOfDay,
      myHobbies: me.hobbies,
      partnerHobbies: partner.hobbies,
    });

    const plans = await Promise.all(
      ideas.map(async (idea) => {
        const shops = await searchHotPepper({
          area,
          keyword: idea.keyword,
          budget,
        });

        return {
          ...idea,
          area,
          shops: shops.map((shop) => ({
            name: shop.name,
            address: shop.address,
            catchCopy: shop.catch,
            budgetText: shop.budget?.name ?? "",
            imageUrl: shop.photo?.pc?.l ?? "",
            sourceUrl: shop.urls?.pc ?? "",
          })),
        };
      })
    );

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("POST /api/date-plans/generate error:", error);
    return NextResponse.json(
      { error: "デートプランの生成に失敗しました" },
      { status: 500 }
    );
  }
}