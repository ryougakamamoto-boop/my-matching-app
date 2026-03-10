"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("名前・メール・パスワードを入力してください");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.user) {
        setMessage("ユーザー作成に失敗しました");
        return;
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authId: data.user.id,
          email: email.trim(),
          name: name.trim(),
          bio: bio.trim() || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error ?? "プロフィール作成に失敗しました");
        return;
      }

      setMessage("登録完了。ログイン画面へ進んでください。");
      setName("");
      setEmail("");
      setPassword("");
      setBio("");
    } catch (error) {
      console.error(error);
      setMessage("登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
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
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 24, textAlign: "center" }}>
          新規登録
        </h1>

        <div style={{ display: "grid", gap: 12 }}>
          <input
            type="text"
            placeholder="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <textarea
            placeholder="自己紹介"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              padding: 14,
              borderRadius: 999,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </div>

        {message && (
          <p style={{ marginTop: 16, textAlign: "center" }}>{message}</p>
        )}

        <p style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/login">ログインはこちら</Link>
        </p>
      </div>
    </main>
  );
}