import { supabase } from "@/lib/supabase";

export async function loginWithProfile(email: string, password: string) {
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error("メールアドレスとパスワードを入力してください");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  const authUser = data?.user;

  console.log("login data =", data);
  console.log("authUser =", authUser);
  console.log("authUser.id =", authUser?.id);

  if (!authUser?.id) {
    throw new Error("ログインユーザーを取得できませんでした");
  }

  let res = await fetch(`/api/users/me?authId=${encodeURIComponent(authUser.id)}`);
  let json = await res.json();

  if (res.status === 404) {
    const createRes = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authId: authUser.id,
        email: authUser.email,
        name: authUser.email?.split("@")[0] || "user",
        bio: null,
        imageUrl: null,
      }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok) {
      throw new Error(createJson.error || "プロフィール自動作成に失敗しました");
    }

    res = await fetch(`/api/users/me?authId=${encodeURIComponent(authUser.id)}`);
    json = await res.json();
  }

  if (!res.ok) {
    throw new Error(json.error || "ユーザー取得に失敗しました");
  }

  return {
    authUser,
    profile: json,
  };
}