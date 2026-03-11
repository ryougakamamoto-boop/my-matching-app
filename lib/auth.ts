import { supabase } from "@/lib/supabase";

type SignUpParams = {
  email: string;
  password: string;
  name: string;
  bio?: string;
  imageUrl?: string;
};

export async function signUpWithProfile({
  email,
  password,
  name,
  bio,
  imageUrl,
}: SignUpParams) {
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanPassword || !cleanName) {
    throw new Error("email, password, name は必須です");
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  const authUser = data.user;

  if (!authUser) {
    throw new Error("Supabase Authユーザーの作成に失敗しました");
  }

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

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentAuthUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}