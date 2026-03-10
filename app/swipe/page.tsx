"use client";

import Link from "next/link";
import TinderCard from "react-tinder-card";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type User = {
  id: string;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
};

type SwipeDirection = "left" | "right" | "up" | "down";

export default function SwipePage() {
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("userId");

  const [people, setPeople] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState("読み込み中...");
  const [lastDirection, setLastDirection] = useState("");
  const [overlay, setOverlay] = useState<"" | "LIKE" | "NOPE">("");

  const currentIndex = people.length - 1;
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    async function init() {
      try {
        const usersRes = await fetch("/api/users", { cache: "no-store" });
        const usersData = await usersRes.json();

        if (!usersRes.ok || !Array.isArray(usersData) || usersData.length < 2) {
          setMessage("最低2人のユーザーを登録してください");
          return;
        }

        const current = usersData.find((u: User) => u.id === selectedUserId);

        if (!current) {
          setMessage("ユーザーを選び直してください");
          return;
        }

        setCurrentUser(current);

        const candidatesRes = await fetch(
          `/api/candidates?currentUserId=${current.id}`,
          { cache: "no-store" }
        );
        const candidatesData = await candidatesRes.json();

        if (!candidatesRes.ok || !Array.isArray(candidatesData)) {
          setMessage("候補取得に失敗しました");
          return;
        }

        setPeople(candidatesData);
        setMessage("");
      } catch (error) {
        console.error(error);
        setMessage("データ取得に失敗しました");
      }
    }

    init();
  }, [selectedUserId]);

  const childRefs = useMemo(
    () =>
      Array(people.length)
        .fill(0)
        .map(() => ({ current: null as any })),
    [people.length]
  );

  async function handleSwipeApi(target: User, direction: SwipeDirection) {
    if (!currentUser) return;

    const action = direction === "right" ? "like" : "skip";

    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: target.id,
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "スワイプ処理に失敗しました");
        return;
      }

      if (action === "like" && data.matched) {
        alert("マッチしました！");
      }
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました");
    }
  }

  async function swiped(direction: SwipeDirection, user: User, index: number) {
    const result = direction === "right" ? "LIKE" : "NOPE";
    setLastDirection(result);
    setOverlay(result);

    setTimeout(() => setOverlay(""), 500);

    await handleSwipeApi(user, direction);

    setPeople((prev) => prev.filter((_, i) => i !== index));
  }

  function outOfFrame(name: string) {
    console.log(name + " left the screen");
  }

  async function swipeManually(dir: "left" | "right") {
    if (currentIndex < 0 || currentIndex >= people.length) return;

    const user = people[currentIndex];
    const result = dir === "right" ? "LIKE" : "NOPE";

    setLastDirection(result);
    setOverlay(result);
    setTimeout(() => setOverlay(""), 500);

    await handleSwipeApi(user, dir);
    setPeople((prev) => prev.slice(0, -1));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
            ← ホームに戻る
          </Link>
        </div>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>スワイプ</h1>

        {currentUser && (
          <p style={{ marginBottom: 20 }}>
            現在のユーザー: <strong>{currentUser.name}</strong>
          </p>
        )}

        {message && <p>{message}</p>}

        {!message && people.length === 0 && <p>表示できるユーザーがいません</p>}

        {!message && people.length > 0 && (
          <>
            <div
              style={{
                position: "relative",
                width: 320,
                height: 520,
                margin: "0 auto",
              }}
            >
              {people.map((person, index) => (
                <TinderCard
                  key={person.id}
                  ref={childRefs[index]}
                  onSwipe={(dir) => swiped(dir as SwipeDirection, person, index)}
                  onCardLeftScreen={() => outOfFrame(person.name)}
                  preventSwipe={["up", "down"]}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 320,
                      height: 520,
                      background: "#fff",
                      borderRadius: 24,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
                      overflow: "hidden",
                      cursor: "grab",
                      userSelect: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    {index === currentIndex && overlay && (
                      <div
                        style={{
                          position: "absolute",
                          top: 24,
                          left: overlay === "NOPE" ? 24 : "auto",
                          right: overlay === "LIKE" ? 24 : "auto",
                          zIndex: 10,
                          padding: "8px 16px",
                          border: `4px solid ${
                            overlay === "LIKE" ? "#22c55e" : "#ef4444"
                          }`,
                          color: overlay === "LIKE" ? "#22c55e" : "#ef4444",
                          fontSize: 28,
                          fontWeight: "bold",
                          borderRadius: 12,
                          transform: "rotate(-12deg)",
                          background: "rgba(255,255,255,0.75)",
                        }}
                      >
                        {overlay}
                      </div>
                    )}

                    <div
                      style={{
                        height: 340,
                        background: "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {person.imageUrl ? (
                        <img
                          src={person.imageUrl}
                          alt={person.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 72,
                          }}
                        >
                          👤
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: 24,
                        textAlign: "left",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 12px",
                          fontSize: 30,
                        }}
                      >
                        {person.name}
                      </h2>

                      <p
                        style={{
                          margin: 0,
                          color: "#555",
                          fontSize: 18,
                          lineHeight: 1.5,
                        }}
                      >
                        {person.bio || "自己紹介はまだありません"}
                      </p>
                    </div>
                  </div>
                </TinderCard>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => swipeManually("left")}
                style={{
                  width: 120,
                  padding: "14px 0",
                  borderRadius: 999,
                  border: "none",
                  background: "#9ca3af",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Skip
              </button>

              <button
                onClick={() => swipeManually("right")}
                style={{
                  width: 120,
                  padding: "14px 0",
                  borderRadius: 999,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Like
              </button>
            </div>

            {lastDirection && people.length > 0 && (
              <p
                style={{
                  marginTop: 16,
                  fontSize: 20,
                  fontWeight: "bold",
                  color: lastDirection === "LIKE" ? "#22c55e" : "#ef4444",
                }}
              >
                {lastDirection}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}