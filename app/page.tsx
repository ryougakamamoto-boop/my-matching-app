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

type BottomTab = "discover" | "matches" | "mypage";

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
  birthDate?: string | null;
  height?: number | null;
  weight?: number | null;
  hobbies?: string | null;
  occupation?: string | null;
  livingArea?: string | null;
  meetingArea: string[];
  bio?: string | null;
  imageUrls: string[];
};

type MatchPartner = {
  id: string;
  name: string;
  bio?: string | null;
  imageUrls?: string[];
  birthDate?: string | null;
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
    birthDate?: string | null;
  };
};

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

export default function HomePage() {
  const [view, setView] = useState<View>("loading");
  const [bottomTab, setBottomTab] = useState<BottomTab>("discover");

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [biologicalSex, setBiologicalSex] = useState("");
  const [romanticTarget, setRomanticTarget] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [occupation, setOccupation] = useState("");
  const [livingArea, setLivingArea] = useState("");
  const [meetingArea, setMeetingArea] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [sortType, setSortType] = useState<"distance" | "recent" | "active">(
    "distance"
  );
  const [minAgeFilter, setMinAgeFilter] = useState("");
  const [maxAgeFilter, setMaxAgeFilter] = useState("");
  const [minHeightFilter, setMinHeightFilter] = useState("");
  const [maxHeightFilter, setMaxHeightFilter] = useState("");
  const [livingAreaFilter, setLivingAreaFilter] = useState("");
  const [meetingAreaFilter, setMeetingAreaFilter] = useState("");

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

  const [activeImageIndexes, setActiveImageIndexes] = useState<
    Record<string, number>
  >({});
  const [detailPerson, setDetailPerson] = useState<AppUser | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentIndex = people.length - 1;

  const [dateIntentLoading, setDateIntentLoading] = useState(false);
  const [datePlanLoading, setDatePlanLoading] = useState(false);
  const [bothWantToMeet, setBothWantToMeet] = useState(false);
  const [dateBudget, setDateBudget] = useState<"low" | "medium" | "high">(
    "low"
  );
  const [dateDuration, setDateDuration] = useState<
    "short" | "medium" | "long"
  >("short");
  const [dateMood, setDateMood] = useState<"quiet" | "lively">("quiet");
  const [dateTimeOfDay, setDateTimeOfDay] = useState<"day" | "night">("day");
  const [datePlans, setDatePlans] = useState<
    {
      title: string;
      summary: string;
      budgetLabel: string;
      durationLabel: string;
      area: string;
      shops: {
        name: string;
        address: string;
        catchCopy: string;
        budgetText: string;
        imageUrl: string;
        sourceUrl: string;
      }[];
    }[]
  >([]);

  function calcAge(birthDateValue: string) {
    const today = new Date();
    const birth = new Date(birthDateValue);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  function toggleMeetingArea(area: string) {
    setMeetingArea((prev) =>
      prev.includes(area)
        ? prev.filter((item) => item !== area)
        : [...prev, area]
    );
  }

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  useEffect(() => {
    if (view === "home" && appUser?.id) {
      loadReceivedLikes(appUser.id);
    }
  }, [view, appUser?.id]);

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

  function getImageIndex(person: AppUser) {
    return activeImageIndexes[person.id] ?? 0;
  }

  function nextImage(person: AppUser) {
    const total = person.imageUrls?.length ?? 0;
    if (total <= 1) return;

    setActiveImageIndexes((prev) => ({
      ...prev,
      [person.id]: ((prev[person.id] ?? 0) + 1) % total,
    }));
  }

  function prevImage(person: AppUser) {
    const total = person.imageUrls?.length ?? 0;
    if (total <= 1) return;

    setActiveImageIndexes((prev) => {
      const current = prev[person.id] ?? 0;
      return {
        ...prev,
        [person.id]: (current - 1 + total) % total,
      };
    });
  }

  async function sendDateIntent() {
    if (!appUser || !selectedMatch) return;

    try {
      setDateIntentLoading(true);
      setMessage("");

      const res = await fetch("/api/date-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          userId: appUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "会いたい意思の送信に失敗しました");
        return;
      }

      if (data.bothReady) {
        setBothWantToMeet(true);
        setMessage(
          "お互いが会いたい状態になりました。条件を選んでプランを作れます。"
        );
      } else {
        setMessage("会いたい意思を送信しました。相手の返答を待ちましょう。");
      }
    } catch (error) {
      console.error(error);
      setMessage("会いたい意思の送信中にエラーが発生しました");
    } finally {
      setDateIntentLoading(false);
    }
  }

  async function generateDatePlans() {
    if (!appUser || !selectedMatch) return;

    try {
      setDatePlanLoading(true);
      setMessage("");
      setDatePlans([]);

      const res = await fetch("/api/date-plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          userId: appUser.id,
          budget: dateBudget,
          duration: dateDuration,
          mood: dateMood,
          timeOfDay: dateTimeOfDay,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "デートプラン生成に失敗しました");
        return;
      }

      setDatePlans(data.plans ?? []);
    } catch (error) {
      console.error(error);
      setMessage("デートプラン生成中にエラーが発生しました");
    } finally {
      setDatePlanLoading(false);
    }
  }

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
      birthDate: item.fromUser.birthDate ?? null,
      height: null,
      weight: null,
      hobbies: null,
      occupation: null,
      livingArea: null,
      meetingArea: [],
      bio: item.fromUser.bio ?? null,
      imageUrls: item.fromUser.imageUrls ?? [],
    };

    setBottomTab("discover");
    setPeople([person]);
    setActiveImageIndexes({ [person.id]: 0 });
    setLastDirection("");
    setOverlay("");
    setDetailPerson(null);
    setView("swipe");
  }

  function openEditProfile() {
    if (!appUser) return;

    setBottomTab("mypage");
    setBio(appUser.bio ?? "");
    setBirthDate(
      appUser.birthDate
        ? new Date(appUser.birthDate).toISOString().slice(0, 10)
        : ""
    );
    setHeight(appUser.height ? String(appUser.height) : "");
    setWeight(appUser.weight ? String(appUser.weight) : "");
    setHobbies(appUser.hobbies ?? "");
    setOccupation(appUser.occupation ?? "");
    setLivingArea(appUser.livingArea ?? "");
    setMeetingArea(appUser.meetingArea ?? []);
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
          meetingArea,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error ?? "プロフィール更新に失敗しました");
        return;
      }

      setAppUser({
        ...result,
        imageUrls: result.imageUrls ?? [],
        meetingArea: result.meetingArea ?? [],
      });
      setPreviewUrls(result.imageUrls ?? []);
      setImageFiles([]);
      setMessage("プロフィールを更新しました");
      setBottomTab("mypage");
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

  async function openSwipeAfterLogin(currentUserId: string) {
    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams({
        currentUserId,
        sort: sortType,
      });

      if (minAgeFilter) params.set("minAge", minAgeFilter);
      if (maxAgeFilter) params.set("maxAge", maxAgeFilter);
      if (minHeightFilter) params.set("minHeight", minHeightFilter);
      if (maxHeightFilter) params.set("maxHeight", maxHeightFilter);
      if (livingAreaFilter) params.set("livingArea", livingAreaFilter);
      if (meetingAreaFilter) params.set("meetingArea", meetingAreaFilter);

      const res = await fetch(`/api/candidates?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setMessage("候補取得に失敗しました");
        setBottomTab("mypage");
        setView("home");
        return;
      }

      const mappedPeople = data.map((item: AppUser) => ({
        ...item,
        imageUrls: item.imageUrls ?? [],
        meetingArea: item.meetingArea ?? [],
      }));

      const initialIndexes: Record<string, number> = {};
      mappedPeople.forEach((person: AppUser) => {
        initialIndexes[person.id] = 0;
      });

      setPeople(mappedPeople);
      setActiveImageIndexes(initialIndexes);
      setLastDirection("");
      setOverlay("");
      setDetailPerson(null);
      setBottomTab("discover");
      setView("swipe");
    } catch (error) {
      console.error(error);
      setMessage("候補取得中にエラーが発生しました");
      setBottomTab("mypage");
      setView("home");
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
            birthDate: null,
            bio: null,
            imageUrls: [],
            height: null,
            weight: null,
            hobbies: null,
            occupation: null,
            livingArea: null,
            meetingArea: [],
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
        meetingArea: data.meetingArea ?? [],
      });

      await loadReceivedLikes(data.id);
      await openSwipeAfterLogin(data.id);
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
      !romanticTarget ||
      !birthDate
    ) {
      setMessage(
        "名前・メール・パスワード・性別・恋愛対象・生年月日を入力してください"
      );
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
          birthDate,
          bio: bio.trim() || null,
          imageUrls,
          height: height.trim() ? Number(height) : null,
          weight: weight.trim() ? Number(weight) : null,
          hobbies: hobbies.trim() || null,
          occupation: occupation.trim() || null,
          livingArea: livingArea.trim() || null,
          meetingArea,
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
      setBirthDate("");
      setHeight("");
      setWeight("");
      setHobbies("");
      setOccupation("");
      setLivingArea("");
      setMeetingArea([]);
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
    setActiveImageIndexes({});
    setDetailPerson(null);
    setMessage("");
    setBottomTab("discover");
    setView("login");
  }

  async function openSwipe() {
    if (!appUser) return;

    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams({
        currentUserId: appUser.id,
        sort: sortType,
      });

      if (minAgeFilter) params.set("minAge", minAgeFilter);
      if (maxAgeFilter) params.set("maxAge", maxAgeFilter);
      if (minHeightFilter) params.set("minHeight", minHeightFilter);
      if (maxHeightFilter) params.set("maxHeight", maxHeightFilter);
      if (livingAreaFilter) params.set("livingArea", livingAreaFilter);
      if (meetingAreaFilter) params.set("meetingArea", meetingAreaFilter);

      const res = await fetch(`/api/candidates?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setMessage("候補取得に失敗しました");
        return;
      }

      const mappedPeople = data.map((item: AppUser) => ({
        ...item,
        imageUrls: item.imageUrls ?? [],
        meetingArea: item.meetingArea ?? [],
      }));

      const initialIndexes: Record<string, number> = {};
      mappedPeople.forEach((person: AppUser) => {
        initialIndexes[person.id] = 0;
      });

      setPeople(mappedPeople);
      setActiveImageIndexes(initialIndexes);
      setLastDirection("");
      setOverlay("");
      setDetailPerson(null);
      setBottomTab("discover");
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
      setBottomTab("matches");
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

      setDatePlans([]);
      setBothWantToMeet(false);

      const res = await fetch(`/api/messages?matchId=${match.id}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setMessage("チャット取得に失敗しました");
        return;
      }

      setMessages(data);
      setBottomTab("matches");
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

    setActiveImageIndexes((prev) => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    setReceivedLikes((prev) =>
      prev.filter((item) => item.fromUser.id !== user.id)
    );
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

    setActiveImageIndexes((prev) => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    setReceivedLikes((prev) =>
      prev.filter((item) => item.fromUser.id !== user.id)
    );
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

  function renderPrefectureSelect(
    value: string,
    onChange: (value: string) => void,
    placeholder: string
  ) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        <option value="">{placeholder}</option>
        {PREFECTURES.map((prefecture) => (
          <option key={prefecture} value={prefecture}>
            {prefecture}
          </option>
        ))}
      </select>
    );
  }

  function renderReceivedLikesBanner() {
    if (receivedLikes.length === 0) return null;

    return (
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#9a3412",
            padding: 12,
            borderRadius: 14,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          あなたに {receivedLikes.length} 件のいいねが来ています
        </div>

        <button
          onClick={() => {
            setBottomTab("discover");
            setView("receivedLikes");
          }}
          style={{
            width: "100%",
            padding: "12px 18px",
            borderRadius: 999,
            border: "none",
            background: "#f59e0b",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          いいねしてきた人を見る
        </button>
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

        {isRegister && (
          <div style={{ display: "grid", gap: 6 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "#374151",
              }}
            >
              生年月日
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #ccc",
                fontSize: 16,
                boxSizing: "border-box",
                background: "#fff",
              }}
            />
          </div>
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

        {isRegister &&
          renderPrefectureSelect(
            livingArea,
            setLivingArea,
            "住んでいる地域を選択"
          )}

        {isRegister && (
          <div style={{ display: "grid", gap: 8 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "#374151",
              }}
            >
              会える地域（複数選択可）
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
                maxHeight: 220,
                overflowY: "auto",
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 12,
                background: "#fff",
              }}
            >
              {PREFECTURES.map((prefecture) => (
                <label
                  key={prefecture}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={meetingArea.includes(prefecture)}
                    onChange={() => toggleMeetingArea(prefecture)}
                  />
                  {prefecture}
                </label>
              ))}
            </div>
          </div>
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
        paddingBottom: appUser ? 92 : 16,
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
            <h2 style={{ textAlign: "center", marginBottom: 12 }}>マイページ</h2>

            {renderReceivedLikesBanner()}

            <p style={{ textAlign: "center", marginBottom: 8 }}>
              ユーザー名: {appUser.name}
            </p>
            <p style={{ textAlign: "center", marginBottom: 8 }}>
              性別: {appUser.biologicalSex}
            </p>
            <p style={{ textAlign: "center", marginBottom: 8 }}>
              恋愛対象: {appUser.romanticTarget}
            </p>
            <p style={{ textAlign: "center", marginBottom: 20 }}>
              年齢: {appUser.birthDate ? `${calcAge(appUser.birthDate)}歳` : "未設定"}
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
                onClick={() => {
                  setBottomTab("mypage");
                  setView("home");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← マイページに戻る
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

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "#374151",
                  }}
                >
                  生年月日
                </label>
                <input
                  type="date"
                  value={birthDate}
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
                <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
                  生年月日は登録後に変更できません
                </p>
              </div>

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

              {renderPrefectureSelect(
                livingArea,
                setLivingArea,
                "住んでいる地域を選択"
              )}

              <div style={{ display: "grid", gap: 8 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "#374151",
                  }}
                >
                  会える地域（複数選択可）
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 10,
                    border: "1px solid #ccc",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  {PREFECTURES.map((prefecture) => (
                    <label
                      key={prefecture}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={meetingArea.includes(prefecture)}
                        onChange={() => toggleMeetingArea(prefecture)}
                      />
                      {prefecture}
                    </label>
                  ))}
                </div>
              </div>

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
                onClick={() => {
                  setBottomTab("discover");
                  setView("swipe");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← 探すに戻る
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
                        {item.fromUser.birthDate
                          ? `・${calcAge(item.fromUser.birthDate)}歳`
                          : ""}
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
                onClick={() => {
                  setBottomTab("mypage");
                  setView("home");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ← マイページへ
              </button>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: 12 }}>探す</h2>

            {renderReceivedLikesBanner()}

            <div
              style={{
                display: "grid",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <select
                value={sortType}
                onChange={(e) =>
                  setSortType(e.target.value as "distance" | "recent" | "active")
                }
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  fontSize: 14,
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              >
                <option value="distance">距離が近い順</option>
                <option value="recent">登録が新しい順</option>
                <option value="active">ログインが新しい順</option>
              </select>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
              >
                <input
                  type="number"
                  placeholder="最低年齢"
                  value={minAgeFilter}
                  onChange={(e) => setMinAgeFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #ccc",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                <input
                  type="number"
                  placeholder="最高年齢"
                  value={maxAgeFilter}
                  onChange={(e) => setMaxAgeFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #ccc",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
              >
                <input
                  type="number"
                  placeholder="最低身長"
                  value={minHeightFilter}
                  onChange={(e) => setMinHeightFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #ccc",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                <input
                  type="number"
                  placeholder="最高身長"
                  value={maxHeightFilter}
                  onChange={(e) => setMaxHeightFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #ccc",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {renderPrefectureSelect(
                livingAreaFilter,
                setLivingAreaFilter,
                "住んでいる地域で絞る"
              )}

              {renderPrefectureSelect(
                meetingAreaFilter,
                setMeetingAreaFilter,
                "会える地域で絞る"
              )}

              <button
                onClick={openSwipe}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                この条件で探す
              </button>
            </div>

            {people.length === 0 ? (
              <p style={{ textAlign: "center" }}>表示できるユーザーがいません</p>
            ) : (
              <>
                <div
                  style={{
                    position: "relative",
                    width: "92vw",
                    maxWidth: 380,
                    height: "78vh",
                    minHeight: 560,
                    maxHeight: 680,
                    margin: "0 auto",
                  }}
                >
                  {people.map((person, index) => {
                    const imageIndex = getImageIndex(person);
                    const hasImages =
                      person.imageUrls && person.imageUrls.length > 0;
                    const currentImageUrl = hasImages
                      ? person.imageUrls[imageIndex]
                      : null;

                    return (
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
                            position: "relative",
                            width: "92vw",
                            maxWidth: 380,
                            height: "78vh",
                            minHeight: 560,
                            maxHeight: 680,
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "#fff",
                              borderRadius: 28,
                              boxShadow: "0 14px 36px rgba(0,0,0,0.16)",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            {index === currentIndex && overlay && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 18,
                                  left: overlay === "NOPE" ? 18 : "auto",
                                  right: overlay === "LIKE" ? 18 : "auto",
                                  zIndex: 40,
                                  padding: "8px 14px",
                                  border: `4px solid ${
                                    overlay === "LIKE" ? "#22c55e" : "#ef4444"
                                  }`,
                                  color:
                                    overlay === "LIKE" ? "#22c55e" : "#ef4444",
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  borderRadius: 12,
                                  transform: "rotate(-12deg)",
                                  background: "rgba(255,255,255,0.82)",
                                }}
                              >
                                {overlay}
                              </div>
                            )}

                            <div
                              style={{
                                position: "relative",
                                height: 300,
                                background: "#f3f4f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {hasImages ? (
                                <>
                                  <img
                                    src={currentImageUrl ?? ""}
                                    alt={person.name}
                                    draggable={false}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                      background: "#f8fafc",
                                      pointerEvents: "none",
                                    }}
                                  />

                                  {person.imageUrls.length > 1 && (
                                    <>
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: 10,
                                          left: 10,
                                          right: 10,
                                          zIndex: 15,
                                          display: "flex",
                                          gap: 6,
                                        }}
                                      >
                                        {person.imageUrls.map((_, barIndex) => (
                                          <div
                                            key={barIndex}
                                            style={{
                                              flex: 1,
                                              height: 4,
                                              borderRadius: 999,
                                              background:
                                                barIndex === imageIndex
                                                  ? "rgba(255,255,255,0.98)"
                                                  : "rgba(255,255,255,0.38)",
                                            }}
                                          />
                                        ))}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          prevImage(person);
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          prevImage(person);
                                        }}
                                        style={{
                                          position: "absolute",
                                          top: 0,
                                          left: 0,
                                          width: "50%",
                                          height: "70%",
                                          border: "none",
                                          background: "transparent",
                                          zIndex: 20,
                                          cursor: "pointer",
                                        }}
                                        aria-label="前の画像"
                                      />

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          nextImage(person);
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          nextImage(person);
                                        }}
                                        style={{
                                          position: "absolute",
                                          top: 0,
                                          right: 0,
                                          width: "50%",
                                          height: "70%",
                                          border: "none",
                                          background: "transparent",
                                          zIndex: 20,
                                          cursor: "pointer",
                                        }}
                                        aria-label="次の画像"
                                      />
                                    </>
                                  )}

                                  <div
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      padding: "18px 16px 16px",
                                      background:
                                        "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.38), rgba(0,0,0,0))",
                                      color: "#fff",
                                      zIndex: 30,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDetailPerson(person);
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDetailPerson(person);
                                      }}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#fff",
                                        padding: 0,
                                        margin: 0,
                                        fontSize: 30,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                    >
                                      {person.name}
                                      {person.birthDate
                                        ? `・${calcAge(person.birthDate)}歳`
                                        : ""}
                                    </button>

                                    <p
                                      style={{
                                        margin: "8px 0 0",
                                        fontSize: 15,
                                        lineHeight: 1.5,
                                        color: "rgba(255,255,255,0.95)",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {person.bio?.trim()
                                        ? person.bio.length > 28
                                          ? `${person.bio.slice(0, 28)}...`
                                          : person.bio
                                        : "名前をタップして詳しいプロフィールを見る"}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: 64, color: "#9ca3af" }}>
                                  👤
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                padding: 16,
                                background: "#fff",
                                borderTop: "1px solid #f3f4f6",
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  color: "#6b7280",
                                  fontSize: 14,
                                  textAlign: "center",
                                }}
                              >
                                名前をタップすると詳しいプロフィールを表示
                              </p>
                            </div>
                          </div>
                        </div>
                      </TinderCard>
                    );
                  })}
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
                      color:
                        lastDirection === "LIKE" ? "#22c55e" : "#ef4444",
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
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>マッチ一覧</h2>

            {renderReceivedLikesBanner()}

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
                        {item.partner.birthDate
                          ? `・${calcAge(item.partner.birthDate)}歳`
                          : ""}
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
                onClick={() => {
                  setBottomTab("matches");
                  setView("matches");
                }}
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

            <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
              <button
                onClick={sendDateIntent}
                disabled={dateIntentLoading}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: "#f59e0b",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {dateIntentLoading ? "送信中..." : "会ってみたい"}
              </button>

              {bothWantToMeet && (
                <>
                  <div
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fdba74",
                      color: "#9a3412",
                      padding: 12,
                      borderRadius: 14,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    お互いに会ってみたい状態になりました
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <select
                      value={dateBudget}
                      onChange={(e) =>
                        setDateBudget(
                          e.target.value as "low" | "medium" | "high"
                        )
                      }
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="low">低予算</option>
                      <option value="medium">中予算</option>
                      <option value="high">高予算</option>
                    </select>

                    <select
                      value={dateDuration}
                      onChange={(e) =>
                        setDateDuration(
                          e.target.value as "short" | "medium" | "long"
                        )
                      }
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="short">1〜2時間</option>
                      <option value="medium">2〜3時間</option>
                      <option value="long">3〜4時間</option>
                    </select>

                    <select
                      value={dateMood}
                      onChange={(e) =>
                        setDateMood(e.target.value as "quiet" | "lively")
                      }
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="quiet">静かめ</option>
                      <option value="lively">にぎやか</option>
                    </select>

                    <select
                      value={dateTimeOfDay}
                      onChange={(e) =>
                        setDateTimeOfDay(e.target.value as "day" | "night")
                      }
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="day">昼</option>
                      <option value="night">夜</option>
                    </select>

                    <button
                      onClick={generateDatePlans}
                      disabled={datePlanLoading}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 999,
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 16,
                        cursor: "pointer",
                      }}
                    >
                      {datePlanLoading
                        ? "提案中..."
                        : "AIにデートプランを提案してもらう"}
                    </button>
                  </div>
                </>
              )}

              {datePlans.length > 0 && (
                <div style={{ display: "grid", gap: 14 }}>
                  <h3 style={{ margin: 0 }}>おすすめデートプラン</h3>

                  {datePlans.map((plan, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#f9fafb",
                        borderRadius: 16,
                        padding: 14,
                        border: "1px solid #e5e7eb",
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div>
                        <h4 style={{ margin: "0 0 8px" }}>{plan.title}</h4>
                        <p style={{ margin: "0 0 6px" }}>場所: {plan.area}</p>
                        <p style={{ margin: "0 0 6px" }}>
                          予算: {plan.budgetLabel}
                        </p>
                        <p style={{ margin: "0 0 6px" }}>
                          所要時間: {plan.durationLabel}
                        </p>
                        <p style={{ margin: 0, color: "#555", lineHeight: 1.6 }}>
                          {plan.summary}
                        </p>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        {plan.shops.map((shop, shopIndex) => (
                          <div
                            key={shopIndex}
                            style={{
                              background: "#fff",
                              borderRadius: 14,
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <strong>{shop.name}</strong>
                            <p style={{ margin: 0, color: "#555" }}>
                              {shop.address}
                            </p>
                            {shop.catchCopy ? (
                              <p style={{ margin: 0, color: "#555" }}>
                                {shop.catchCopy}
                              </p>
                            ) : null}
                            {shop.budgetText ? (
                              <p style={{ margin: 0, color: "#555" }}>
                                予算目安: {shop.budgetText}
                              </p>
                            ) : null}

                            {shop.imageUrl ? (
                              <img
                                src={shop.imageUrl}
                                alt={shop.name}
                                style={{
                                  width: "100%",
                                  borderRadius: 12,
                                  objectFit: "cover",
                                  maxHeight: 180,
                                }}
                              />
                            ) : null}

                            {shop.sourceUrl ? (
                              <a
                                href={shop.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#2563eb", fontWeight: "bold" }}
                              >
                                お店情報を見る
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

        {detailPerson && (
          <div
            onClick={() => setDetailPerson(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              boxSizing: "border-box",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 420,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 24,
                boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
                overflowX: "hidden",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: 320,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {detailPerson.imageUrls && detailPerson.imageUrls.length > 0 ? (
                  <img
                    src={detailPerson.imageUrls[0]}
                    alt={detailPerson.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#f8fafc",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 64, color: "#9ca3af" }}>👤</div>
                )}

                <button
                  type="button"
                  onClick={() => setDetailPerson(null)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255,255,255,0.9)",
                    cursor: "pointer",
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: 20 }}>
                <h2
                  style={{
                    margin: "0 0 14px",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  {detailPerson.name}
                </h2>

                {detailPerson.birthDate ? (
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: 16,
                      color: "#4b5563",
                      fontWeight: 600,
                    }}
                  >
                    {calcAge(detailPerson.birthDate)}歳
                  </p>
                ) : null}

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: "#f8fafc",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#374151",
                        lineHeight: 1.7,
                        wordBreak: "break-word",
                      }}
                    >
                      {detailPerson.bio || "自己紹介はまだありません"}
                    </p>
                  </div>

                  {detailPerson.height ? (
                    <p style={{ margin: 0 }}>身長: {detailPerson.height}cm</p>
                  ) : null}
                  {detailPerson.weight ? (
                    <p style={{ margin: 0 }}>体重: {detailPerson.weight}kg</p>
                  ) : null}
                  {detailPerson.hobbies ? (
                    <p style={{ margin: 0 }}>趣味: {detailPerson.hobbies}</p>
                  ) : null}
                  {detailPerson.occupation ? (
                    <p style={{ margin: 0 }}>職業: {detailPerson.occupation}</p>
                  ) : null}
                  {detailPerson.livingArea ? (
                    <p style={{ margin: 0 }}>
                      住んでいる地域: {detailPerson.livingArea}
                    </p>
                  ) : null}
                  {detailPerson.occupation ? (
  <p style={{ margin: 0 }}>職業: {detailPerson.occupation}</p>
) : null}

{detailPerson.livingArea ? (
  <p style={{ margin: 0 }}>
    住んでいる地域: {detailPerson.livingArea}
  </p>
) : null}

{Array.isArray(detailPerson.meetingArea) &&
detailPerson.meetingArea.length > 0 ? (
  <p style={{ margin: 0 }}>
    会える地域: {detailPerson.meetingArea.join("、")}
  </p>
) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <p style={{ marginTop: 20, textAlign: "center" }}>{message}</p>
        )}
      </div>

      {appUser &&
        view !== "loading" &&
        view !== "login" &&
        view !== "register" && (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#fff",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-around",
              padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
              zIndex: 999,
            }}
          >
            <button
              onClick={async () => {
                setBottomTab("discover");
                await openSwipe();
              }}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                padding: 10,
                fontWeight: bottomTab === "discover" ? "bold" : "normal",
                color: bottomTab === "discover" ? "#ef4444" : "#6b7280",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              探す
            </button>

            <button
              onClick={async () => {
                setBottomTab("matches");
                await openMatches();
              }}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                padding: 10,
                fontWeight: bottomTab === "matches" ? "bold" : "normal",
                color: bottomTab === "matches" ? "#2563eb" : "#6b7280",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              マッチ
            </button>

            <button
              onClick={() => {
                setBottomTab("mypage");
                setView("home");
              }}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                padding: 10,
                fontWeight: bottomTab === "mypage" ? "bold" : "normal",
                color: bottomTab === "mypage" ? "#10b981" : "#6b7280",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              マイページ
            </button>
          </div>
        )}
    </main>
  );
}