import { supabase } from "@/lib/supabase";

type SignupParams = {
  name: string;
  email: string;
  password: string;
  bio?: string;
  imageUrl?: string;
};

export async function signUpWithProfile({
  name,
  email,
  password,
  bio,
  imageUrl,
}: SignupParams) {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw new Error("名前・メールアドレス・パスワードは必須です");
  }

  // 1. Supabase Authに登録
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  const authUser = data.user;

  if (!authUser) {
    throw new Error("認証ユーザーの作成に失敗しました");
  }

  // 2. Prisma側にプロフィール保存
  const res = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authId: authUser.id,
      email: cleanEmail,
      name: cleanName,
      bio: bio?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "プロフィール保存に失敗しました");
  }

  return {
    authUser,
    profile: json,
  };
}