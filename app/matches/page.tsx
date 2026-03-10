"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Partner = {
  id: string;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
};

type MatchItem = {
  id: string;
  createdAt: string;
  partner: Partner;
};

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [message, setMessage] = useState("読み込み中...");

  useEffect(() => {
    async function fetchMatches() {
      if (!userId) {
        setMessage("userId をURLに指定してください");
        return;
      }

      try {
        const res = await fetch(`/api/matches?currentUserId=${userId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          setMessage(data.error ?? "マッチ一覧の取得に失敗しました");
          return;
        }

        setMatches(Array.isArray(data) ? data : []);
        setMessage("");
      } catch (error) {
        console.error(error);
        setMessage("通信エラーが発生しました");
      }
    }

    fetchMatches();
  }, [userId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          マッチ一覧
        </h1>

        {userId && (
          <p style={{ textAlign: "center", marginBottom: 24 }}>
            現在のユーザーID: {userId}
          </p>
        )}

        {message && <p style={{ textAlign: "center" }}>{message}</p>}

        {!message && matches.length === 0 && (
          <p style={{ textAlign: "center" }}>まだマッチがありません</p>
        )}

        {!message &&
          matches.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#fff",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#e5e7eb",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {item.partner.imageUrl ? (
                  <img
                    src={item.partner.imageUrl}
                    alt={item.partner.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : null}
              </div>

              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>
                  {item.partner.name}
                </h2>
                <p style={{ margin: "0 0 8px", color: "#555" }}>
                  {item.partner.bio || "自己紹介はまだありません"}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
                  マッチ日時: {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}