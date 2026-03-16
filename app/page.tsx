"use client";

import TinderCard from "react-tinder-card";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";

type View =
  | "loading"
  | "login"
  | "register"
  | "home"
  | "swipe"
  | "matches"
  | "chat"
  | "receivedLikes"
  | "editProfile";

type AuthUser = {
  id: string;
  email?: string;
};

type AppUser = {
  id: string;
  authId: string;
  email: string;
  name: string;
  biologicalSex: string;
  romanticTarget: string;
  height?: number | null;
  weight?: number | null;
  hobbies?: string | null;
  occupation?: string | null;
  livingArea?: string | null;
  meetingArea?: string | null;
  bio?: string | null;
  imageUrls: string[];
};

type MatchPartner = {
  id: string;
  name: string;
  bio?: string | null;
  imageUrls?: string[];
};

type MatchItem = {
  id: string;
  createdAt: string;
  partner: MatchPartner;
};

type MessageItem = {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
  };
};

type SwipeDirection = "left" | "right" | "up" | "down";

type ReceivedLikeItem = {
  id: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    bio?: string | null;
    imageUrls?: string[];
  };
};

export default function HomePage() {
  const [view, setView] = useState<View>("loading");

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [biologicalSex, setBiologicalSex] = useState("");
  const [romanticTarget, setRomanticTarget] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [occupation, setOccupation] = useState("");
  const [livingArea, setLivingArea] = useState("");
  const [meetingArea, setMeetingArea] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [people, setPeople] = useState<AppUser[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [receivedLikes, setReceivedLikes] = useState<ReceivedLikeItem[]>([]);
  const [lastDirection, setLastDirection] = useState("");
  const [overlay, setOverlay] = useState<"" | "LIKE" | "NOPE">("");

  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentIndex = people.length - 1;

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  useEffect(() => {
    if (view !== "chat" || !selectedMatch || !appUser) return;

    const channel = supabase
      .channel(`messages-${selectedMatch.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `matchId=eq.${selectedMatch.id}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            text: string;
            createdAt: string;
            senderId: string;
            matchId: string;
          };

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newRow.id)) return prev;

            return [
              ...prev,
              {
                id: newRow.id,
                text: newRow.text,
                createdAt: newRow.createdAt,
                senderId: newRow.senderId,
                sender: {
                  id: newRow.senderId,
                  name:
                    newRow.senderId === appUser.id
                      ? appUser.name
                      : selectedMatch.partner.name,
                },
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view, selectedMatch, appUser]);

  async function loadReceivedLikes(userId: string) {
    try {
      const res = await fetch(`/api/likes/received?currentUserId=${userId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setReceivedLikes(data);
      }
    } catch (error) {
      console.error("loadReceivedLikes error =", error);
    }
  }

  function openLikedPerson(item: ReceivedLikeItem) {
    const person: AppUser = {
      id: item.fromUser.id,
      authId: "",
      email: "",
      name: item.fromUser.name,
      biologicalSex: "",
      romanticTarget: "",
      height: null,
      weight: null,
      hobbies: null,
      occupation: null,
      livingArea: null,
      meetingArea: null,
      bio: item.fromUser.bio ?? null,
      imageUrls: item.fromUser.imageUrls ?? [],
    };

    setPeople([person]);
    setLastDirection("");
    setOverlay("");
    setView("swipe");
  }

  function openEditProfile() {
    if (!appUser) return;

    setBio(appUser.bio ?? "");
    setHeight(appUser.height ? String(appUser.height) : "");
    setWeight(appUser.weight ? String(appUser.weight) : "");
    setHobbies(appUser.hobbies ?? "");
    setOccupation(appUser.occupation ?? "");
    setLivingArea(appUser.livingArea ?? "");
    setMeetingArea(appUser.meetingArea ?? "");
    setPreviewUrls(appUser.imageUrls ?? []);
    setImageFiles([]);
    setView("editProfile");
  }

  async function uploadMultipleImages(files: File[]) {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? "画像アップロードに失敗しました");
      }

      uploadedUrls.push(uploadData.imageUrl);
    }

    return uploadedUrls;
  }

  async function handleUpdateProfile() {
    if (!appUser || !authUser) return;

    try {
      setLoading(true);
      setMessage("");

      let imageUrls = appUser.imageUrls ?? [];

      if (imageFiles.length > 0) {
        imageUrls = await uploadMultipleImages(imageFiles);
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authId: authUser.id,
          email: appUser.email,
          name: appUser.name,
          biologicalSex: appUser.biologicalSex,
          romanticTarget: appUser.romanticTarget,
          bio: bio.trim() || null,
          imageUrls,
          height: height.trim() ? Number(height) : null,
          weight: weight.trim() ? Number(weight) : null,
          hobbies: hobbies.trim() || null,
          occupation: occupation.trim() || null,
          livingArea: livingArea.trim() || null,
          meetingArea: meetingArea.trim() || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error ?? "プロフィール更新に失敗しました");
        return;
      }

      setAppUser(result);
      setPreviewUrls(result.imageUrls ?? []);
      setImageFiles([]);
      setMessage("プロフィールを更新しました");
      setView("home");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "プロフィール更新中にエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkSession() {
    try {
      setView("loading");
      setMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        setAuthUser(null);
        setAppUser(null);
        setView("login");
        return;
      }

      setAuthUser({
        id: user.id,
        email: user.email,
      });

      let res = await fetch(
        `/api/users/me?authId=${encodeURIComponent(user.id)}`,
        { cache: "no-store" }
      );

      let data = await res.json();

      if (res.status === 404) {
        const createRes = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authId: user.id,
            email: user.email,
            name: user.email?.split("@")[0] || "user",
            biologicalSex: "未設定",
            romanticTarget: "未設定",
            bio: null,
            imageUrls: [],
            height: null,
            weight: null,
            hobbies: null,
            occupation: null,
            livingArea: null,
            meetingArea: null,
          }),
        });

        const createData = await createRes.json();

        if (!createRes.ok) {
          setMessage(createData.error ?? "プロフィール作成に失敗しました");
          setView("login");
          return;
        }

        res = await fetch(
          `/api/users/me?authId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" }
        );

        data = await res.json();
      }

      if (!res.ok) {
        setMessage(data.error ?? "ユーザー取得に失敗しました");
        setView("login");
        return;
      }

      setAppUser({
        ...data,
        imageUrls: data.imageUrls ?? [],
      });

      await loadReceivedLikes(data.id);
      setView("home");
    } catch (error) {
      console.error("checkSession error =", error);
      setMessage(
        error instanceof Error
          ? `セッション確認に失敗しました: ${error.message}`
          : "セッション確認に失敗しました"
      );
      setView("login");
    }
  }

  async function handleRegister() {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !biologicalSex ||
      !romanticTarget
    ) {
      setMessage("名前・メール・パスワード・性別・恋愛対象を入力してください");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        imageUrls = await uploadMultipleImages(imageFiles);
      }

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
          biologicalSex,
          romanticTarget,
          bio: bio.trim() || null,
          imageUrls,
          height: height.trim() ? Number(height) : null,
          weight: weight.trim() ? Number(weight) : null,
          hobbies: hobbies.trim() || null,
          occupation: occupation.trim() || null,
          livingArea: livingArea.trim() || null,
          meetingArea: meetingArea.trim() || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error ?? "プロフィール作成に失敗しました");
        return;
      }

      setMessage("登録完了しました。ログインしてください。");
      setName("");
      setBio("");
      setEmail("");
      setPassword("");
      setBiologicalSex("");
      setRomanticTarget("");
      setHeight("");
      setWeight("");
      setHobbies("");
      setOccupation("");
      setLivingArea("");
      setMeetingArea("");
      setImageFiles([]);
      setPreviewUrls([]);
      setView("login");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "登録中にエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.user) {
        setMessage("ログインユーザーを取得できませんでした");
        return;
      }

      setAuthUser({
        id: data.user.id,
        email: data.user.email,
      });

      setEmail("");
      setPassword("");

      await checkSession();
    } catch (error) {
      console.error(error);
      setMessage("ログイン中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setAppUser(null);
    setPeople([]);
    setMatches([]);
    setMessages([]);
    setReceivedLikes([]);
    setSelectedMatch(null);
    setMessage("");
    setView("login");
  }

  async function openSwipe() {
    if (!appUser) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`/api/candidates?currentUserId=${appUser.id}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setMessage("候補取得に失敗しました");
        return;
      }

      setPeople(
        data.map((item: AppUser) => ({
          ...item,
          imageUrls: item.imageUrls ?? [],
        }))
      );
      setLastDirection("");
      setOverlay("");
      setView("swipe");
    } catch (error) {
      console.error(error);
      setMessage("候補取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function openMatches() {
    if (!appUser) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`/api/matches?currentUserId=${appUser.id}`, {
        cache: "no-store",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !Array.isArray(data)) {
        setMessage(data?.error ?? "マッチ一覧の取得に失敗しました");
        return;
      }

      setMatches(data);
      setView("matches");
    } catch (error) {
      console.error(error);
      setMessage("マッチ取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function openChat(match: MatchItem) {
    try {
      setLoading(true);
      setMessage("");
      setSelectedMatch(match);

      const res = await fetch(`/api/messages?matchId=${match.id}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setMessage("チャット取得に失敗しました");
        return;
      }

      setMessages(data);
      setView("chat");
    } catch (error) {
      console.error(error);
      setMessage("チャット取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!appUser || !selectedMatch || !newMessage.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          senderId: appUser.id,
          text: newMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "送信に失敗しました");
        return;
      }

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === data.id)) return prev;
        return [...prev, data];
      });

      setNewMessage("");
    } catch (error) {
      console.error(error);
      setMessage("送信中にエラーが発生しました");
    }
  }

  async function handleSwipeApi(target: AppUser, direction: SwipeDirection) {
    if (!appUser) return;

    const action = direction === "right" ? "like" : "skip";

    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUserId: appUser.id,
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

      await loadReceivedLikes(appUser.id);
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました");
    }
  }

  async function swiped(
    direction: SwipeDirection,
    user: AppUser,
    index: number
  ) {
    const result = direction === "right" ? "LIKE" : "NOPE";
    setLastDirection(result);
    setOverlay(result);
    setTimeout(() => setOverlay(""), 500);

    await handleSwipeApi(user, direction);
    setPeople((prev) => prev.filter((_, i) => i !== index));
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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);

    if (files.length === 0) {
      setImageFiles([]);
      setPreviewUrls([]);
      return;
    }

    try {
      const compressedFiles: File[] = [];

      for (const file of files) {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });

        compressedFiles.push(compressedFile as File);
      }

      setImageFiles(compressedFiles);
      setPreviewUrls(compressedFiles.map((file) => URL.createObjectURL(file)));
    } catch (error) {
      console.error(error);
      setMessage("画像の圧縮に失敗しました");
    }
  }

  function renderPreviewGrid() {
    if (previewUrls.length === 0) return null;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {previewUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`preview-${index}`}
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
        ))}
      </div>
    );
  }

  function renderAuthInputs(isRegister: boolean) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {isRegister && (
          <input
            type="text"
            placeholder="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <select
            value={biologicalSex}
            onChange={(e) => setBiologicalSex(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
              background: "#fff",
            }}
          >
            <option value="">生物学的性別を選択</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        )}

        {isRegister && (
          <select
            value={romanticTarget}
            onChange={(e) => setRomanticTarget(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
              background: "#fff",
            }}
          >
            <option value="">恋愛対象を選択</option>
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="両方">両方</option>
          </select>
        )}

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #ccc",
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #ccc",
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />

        {isRegister && (
          <input
            type="number"
            placeholder="身長(cm)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <input
            type="number"
            placeholder="体重(kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="趣味"
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="職業"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="住んでいる地域"
            value={livingArea}
            onChange={(e) => setLivingArea(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="会える地域"
            value={meetingArea}
            onChange={(e) => setMeetingArea(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        )}

        {isRegister && (
          <>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #ccc",
                fontSize: 16,
                boxSizing: "border-box",
                background: "#fff",
              }}
            />
            {renderPreviewGrid()}
          </>
        )}

        {isRegister && (
          <textarea
            placeholder="自己紹介"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #ccc",
              fontSize: 16,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>
    );
  }

  const contentMaxWidth = view === "swipe" ? 460 : 520;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: view === "chat" ? "stretch" : "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          background: "#fff",
          borderRadius: 24,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "clamp(28px, 6vw, 48px)",
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          学生が作ったマッチングアプリ
        </h1>

        {view === "loading" && (
          <p style={{ textAlign: "center" }}>読み込み中...</p>
        )}

        {view === "login" && (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>ログイン</h2>

            {renderAuthInputs(false)}

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {loading ? "ログイン中..." : "ログイン"}
              </button>

              <button
                onClick={() => {
                  setMessage("");
                  setView("register");
                }}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                新規登録へ
              </button>
            </div>
          </>
        )}

        {view === "register" && (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>新規登録</h2>

            {renderAuthInputs(true)}

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <button
                onClick={handleRegister}
                disabled={loading}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {loading ? "登録中..." : "登録する"}
              </button>

              <button
                onClick={() => {
                  setMessage("");
                  setView("login");
                }}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#6b7280",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ログインへ戻る
              </button>
            </div>
          </>
        )}

        {view === "home" && appUser && (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 8 }}>ホーム</h2>

            <p
              style={{
                textAlign: "center",
                marginBottom: 20,
                color: "#666",
                fontSize: 14,
              }}
            >
              学生が制作したデモ版マッチングサイトです
            </p>

            {receivedLikes.length > 0 && (
              <>
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    color: "#9a3412",
                    padding: 12,
                    borderRadius: 14,
                    marginBottom: 16,
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  あなたに {receivedLikes.length} 件のいいねが来ています
                </div>

                <button
                  onClick={() => setView("receivedLikes")}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 999,
                    border: "none",
                    background: "#f59e0b",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                    cursor: "pointer",
                    marginBottom: 16,
                  }}
                >
                  いいねしてきた人を見る
                </button>
              </>
            )}

            <p style={{ textAlign: "center", marginBottom: 8 }}>
              ログイン中: {appUser.email}
            </p>
            <p style={{ textAlign: "center", marginBottom: 8 }}>
              ユーザー名: {appUser.name}
            </p>
            <p style={{ textAlign: "center", marginBottom: 8 }}>
              性別: {appUser.biologicalSex}
            </p>
            <p style={{ textAlign: "center", marginBottom: 20 }}>
              恋愛対象: {appUser.romanticTarget}
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              <button
                onClick={openEditProfile}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                プロフィール編集
              </button>

              <button
                onClick={openSwipe}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                新規の相手を見る
              </button>

              <button
                onClick={openMatches}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                マッチした相手を見る
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#6b7280",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ログアウト
              </button>
            </div>
          </>
        )}

        {view === "editProfile" && appUser && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setView("home")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← ホームに戻る
              </button>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: 20 }}>
              プロフィール編集
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                type="text"
                value={appUser.name}
                disabled
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  fontSize: 16,
                  boxSizing: "border-box",
                  background: "#f3f4f6",
                  color: "#666",
                }}
              />

              <input
                type="text"
                value={appUser.biologicalSex}
                disabled
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  fontSize: 16,
                  boxSizing: "border-box",
                  background: "#f3f4f6",
                  color: "#666",
                }}
              />

              <input
                type="text"
                value={appUser.romanticTarget}
                disabled
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  fontSize: 16,
                  boxSizing: "border-box",
                  background: "#f3f4f6",
                  color: "#666",
                }}
              />

              <input
                type="number"
                placeholder="身長(cm)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="number"
                placeholder="体重(kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder="趣味"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder="職業"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder="住んでいる地域"
                value={livingArea}
                onChange={(e) => setLivingArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                placeholder="会える地域"
                value={meetingArea}
                onChange={(e) => setMeetingArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              />

              {renderPreviewGrid()}

              <textarea
                placeholder="自己紹介"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />

              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                style={{
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {loading ? "更新中..." : "プロフィールを更新する"}
              </button>
            </div>
          </>
        )}

        {view === "receivedLikes" && appUser && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setView("home")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← ホームに戻る
              </button>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: 20 }}>
              いいねしてきた人
            </h2>

            {receivedLikes.length === 0 ? (
              <p style={{ textAlign: "center" }}>まだいいねは来ていません</p>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {receivedLikes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openLikedPerson(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "#f9fafb",
                      borderRadius: 16,
                      padding: 14,
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#e5e7eb",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.fromUser.imageUrls &&
                      item.fromUser.imageUrls.length > 0 ? (
                        <img
                          src={item.fromUser.imageUrls[0]}
                          alt={item.fromUser.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 28 }}>👤</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: 20,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.fromUser.name}
                      </h3>
                      <p
                        style={{
                          margin: "0 0 8px",
                          color: "#555",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.fromUser.bio || "自己紹介はまだありません"}
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
                        タップしてこの人を見る
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view === "swipe" && appUser && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setView("home")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← ホームに戻る
              </button>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: 12 }}>スワイプ</h2>
            <p style={{ textAlign: "center", marginBottom: 20 }}>
              現在のユーザー: <strong>{appUser.name}</strong>
            </p>

            {people.length === 0 ? (
              <p style={{ textAlign: "center" }}>表示できるユーザーがいません</p>
            ) : (
              <>
                <div
                  style={{
                    position: "relative",
                    width: "90vw",
                    maxWidth: 360,
                    height: "65vh",
                    minHeight: 480,
                    maxHeight: 560,
                    margin: "0 auto",
                  }}
                >
                  {people.map((person, index) => (
                    <TinderCard
                      key={person.id}
                      onSwipe={(dir) =>
                        swiped(dir as SwipeDirection, person, index)
                      }
                      onCardLeftScreen={() => {}}
                      preventSwipe={["up", "down"]}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "90vw",
                          maxWidth: 360,
                          height: "65vh",
                          minHeight: 480,
                          maxHeight: 560,
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
                              top: 20,
                              left: overlay === "NOPE" ? 20 : "auto",
                              right: overlay === "LIKE" ? 20 : "auto",
                              zIndex: 10,
                              padding: "8px 14px",
                              border: `4px solid ${
                                overlay === "LIKE" ? "#22c55e" : "#ef4444"
                              }`,
                              color: overlay === "LIKE" ? "#22c55e" : "#ef4444",
                              fontSize: 24,
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
                            height: "45%",
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {person.imageUrls && person.imageUrls.length > 0 ? (
                            <img
                              src={person.imageUrls[0]}
                              alt={person.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: 64 }}>👤</div>
                          )}
                        </div>

                        <div
                          style={{
                            padding: 20,
                            textAlign: "left",
                            flex: 1,
                          }}
                        >
                          <h3
                            style={{
                              margin: "0 0 12px",
                              fontSize: "clamp(24px, 5vw, 30px)",
                            }}
                          >
                            {person.name}
                          </h3>

                          <p
                            style={{
                              margin: "0 0 8px",
                              color: "#555",
                              fontSize: 16,
                              lineHeight: 1.5,
                              wordBreak: "break-word",
                            }}
                          >
                            {person.bio || "自己紹介はまだありません"}
                          </p>

                          {person.height ? (
                            <p style={{ margin: "0 0 6px", color: "#555" }}>
                              身長: {person.height}cm
                            </p>
                          ) : null}

                          {person.weight ? (
                            <p style={{ margin: "0 0 6px", color: "#555" }}>
                              体重: {person.weight}kg
                            </p>
                          ) : null}

                          {person.hobbies ? (
                            <p style={{ margin: "0 0 6px", color: "#555" }}>
                              趣味: {person.hobbies}
                            </p>
                          ) : null}

                          {person.occupation ? (
                            <p style={{ margin: "0 0 6px", color: "#555" }}>
                              職業: {person.occupation}
                            </p>
                          ) : null}

                          {person.livingArea ? (
                            <p style={{ margin: "0 0 6px", color: "#555" }}>
                              住んでいる地域: {person.livingArea}
                            </p>
                          ) : null}

                          {person.meetingArea ? (
                            <p style={{ margin: "0 0 6px", color: "#555" }}>
                              会える地域: {person.meetingArea}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TinderCard>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => swipeManually("left")}
                    style={{
                      minWidth: 120,
                      padding: "14px 20px",
                      borderRadius: 999,
                      border: "none",
                      background: "#9ca3af",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Skip
                  </button>

                  <button
                    onClick={() => swipeManually("right")}
                    style={{
                      minWidth: 120,
                      padding: "14px 20px",
                      borderRadius: 999,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 16,
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
                      textAlign: "center",
                      fontSize: 18,
                      fontWeight: "bold",
                      color: lastDirection === "LIKE" ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {lastDirection}
                  </p>
                )}
              </>
            )}
          </>
        )}

        {view === "matches" && appUser && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setView("home")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← ホームに戻る
              </button>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: 20 }}>マッチ一覧</h2>

            {matches.length === 0 ? (
              <p style={{ textAlign: "center" }}>まだマッチがありません</p>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {matches.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openChat(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "#f9fafb",
                      borderRadius: 16,
                      padding: 14,
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#e5e7eb",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.partner.imageUrls &&
                      item.partner.imageUrls.length > 0 ? (
                        <img
                          src={item.partner.imageUrls[0]}
                          alt={item.partner.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 28 }}>👤</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: 20,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.partner.name}
                      </h3>
                      <p
                        style={{
                          margin: "0 0 8px",
                          color: "#555",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.partner.bio || "自己紹介はまだありません"}
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
                        タップしてチャット
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view === "chat" && appUser && selectedMatch && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setView("matches")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← マッチ一覧に戻る
              </button>
            </div>

            <h2
              style={{
                textAlign: "center",
                marginBottom: 20,
                fontSize: "clamp(22px, 5vw, 30px)",
                lineHeight: 1.3,
              }}
            >
              {selectedMatch.partner.name} さんとのチャット
            </h2>

            <div
              style={{
                background: "#f9fafb",
                borderRadius: 16,
                padding: 14,
                minHeight: 280,
                maxHeight: "55vh",
                overflowY: "auto",
                marginBottom: 16,
                display: "grid",
                gap: 12,
              }}
            >
              {messages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666" }}>
                  まだメッセージがありません
                </p>
              ) : (
                messages.map((msg) => {
                  const mine = msg.senderId === appUser.id;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "10px 14px",
                          borderRadius: 16,
                          background: mine ? "#2563eb" : "#e5e7eb",
                          color: mine ? "#fff" : "#111",
                          wordBreak: "break-word",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            marginBottom: 4,
                            opacity: 0.8,
                          }}
                        >
                          {msg.sender.name}
                        </div>
                        <div>{msg.text}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexDirection: "row",
                alignItems: "stretch",
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力"
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 999,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  minWidth: 0,
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                送信
              </button>
            </div>
          </>
        )}

        {message && (
          <p style={{ marginTop: 20, textAlign: "center" }}>{message}</p>
        )}
      </div>
    </main>
  );
}