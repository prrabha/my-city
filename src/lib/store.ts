// App store: user (localStorage profile), chats, notifs, and Supabase-backed posts/comments.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type City = {
  id: string;
  name: string;
  region: string;
  nearby: string[];
};

export const CITIES: City[] = [
  { id: "khammam", name: "Khammam", region: "Telangana", nearby: ["Wyra", "Kothagudem", "Sathupalli"] },
  { id: "vijayawada", name: "Vijayawada", region: "Andhra Pradesh", nearby: ["Guntur", "Tenali", "Mangalagiri"] },
  { id: "hyderabad", name: "Hyderabad", region: "Telangana", nearby: ["Secunderabad", "Shamshabad", "Medchal"] },
  { id: "warangal", name: "Warangal", region: "Telangana", nearby: ["Hanamkonda", "Kazipet"] },
  { id: "vizag", name: "Visakhapatnam", region: "Andhra Pradesh", nearby: ["Anakapalle", "Bheemili"] },
  { id: "bangalore", name: "Bangalore", region: "Karnataka", nearby: ["Whitefield", "Electronic City"] },
];

export type User = {
  name: string;
  cityId: string;
  mobile: string;
  verified?: boolean;
  area?: string;
  locationGranted?: boolean;
};

export type GeoPin = {
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  state?: string;
};

export type Post = {
  id: string;
  userId: string;
  authorName: string;
  authorMobile: string;
  authorAvatarUrl: string | null;
  authorDisplayName: string;
  cityId: string;
  cityLabel: string;
  area?: string;
  image: string;
  images?: string[];
  caption: string;
  hashtags?: string[];
  category?: string;
  title?: string;
  price?: number;
  createdAt: number;
  likes: number;
  commentsCount: number;
  sharesCount: number;
  liked: boolean;
  saved: boolean;
  geo?: GeoPin;
};

export function postImages(p: Post): string[] {
  if (p.images && p.images.length) return p.images;
  return [p.image];
}

export type Notification = {
  id: string;
  type: "nearby" | "job" | "rent" | "message" | "activity";
  title: string;
  body: string;
  ts: number;
  read: boolean;
  link?: string;
  image?: string;
};

export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  ts: number;
};

export type Chat = {
  id: string;
  peerName: string;
  peerCity: string;
  unread: number;
  messages: ChatMessage[];
  lastTs: number;
};

const KEY_USER = "loka:user";
const KEY_CHATS = "loka:chats";
const KEY_NOTIFS = "loka:notifs";
const KEY_SAVED = "loka:saved"; // map of postId -> true

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------- User ----------------
export function getUser(): User | null {
  return read<User | null>(KEY_USER, null);
}
export function setUser(u: User | null) {
  if (u) write(KEY_USER, u);
  else if (typeof window !== "undefined") localStorage.removeItem(KEY_USER);
  window.dispatchEvent(new Event("loka:user"));
}
export function useUser() {
  const [user, set] = useState<User | null>(null);
  useEffect(() => {
    set(getUser());
    const fn = () => set(getUser());
    window.addEventListener("loka:user", fn);
    return () => window.removeEventListener("loka:user", fn);
  }, []);
  return user;
}

// ---------------- Saved (local) ----------------
function getSavedMap(): Record<string, boolean> {
  return read<Record<string, boolean>>(KEY_SAVED, {});
}
export function togglePostSave(id: string) {
  const map = getSavedMap();
  map[id] = !map[id];
  if (!map[id]) delete map[id];
  write(KEY_SAVED, map);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("loka:saved"));
}
export function isSaved(id: string): boolean {
  return !!getSavedMap()[id];
}

// ---------------- Posts (Supabase) ----------------
type PostRow = {
  id: string;
  user_id: string;
  author_name: string;
  caption: string;
  title: string | null;
  category: string | null;
  price: number | null;
  city_id: string | null;
  city_label: string;
  area: string | null;
  cover_image: string;
  images: string[];
  hashtags: string[];
  geo: unknown;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  full_name: string;
  username: string;
  avatar_url: string | null;
};

function rowToPost(
  row: PostRow,
  profile: ProfileRow | undefined,
  likedIds: Set<string>,
  savedMap: Record<string, boolean>,
): Post {
  const displayName = profile?.display_name || profile?.full_name || row.author_name;
  return {
    id: row.id,
    userId: row.user_id,
    authorName: displayName,
    authorMobile: "",
    authorAvatarUrl: profile?.avatar_url ?? null,
    authorDisplayName: displayName,
    cityId: row.city_id ?? "",
    cityLabel: row.city_label,
    area: row.area ?? undefined,
    image: row.cover_image,
    images: row.images?.length ? row.images : [row.cover_image],
    caption: row.caption,
    hashtags: row.hashtags ?? [],
    category: row.category ?? undefined,
    title: row.title ?? undefined,
    price: row.price ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    likes: row.likes_count,
    commentsCount: row.comments_count,
    sharesCount: row.shares_count,
    liked: likedIds.has(row.id),
    saved: !!savedMap[row.id],
    geo: (row.geo as GeoPin | null) ?? undefined,
  };
}

async function fetchPostsFromDb(): Promise<Post[]> {
  const { data: rows, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !rows) return [];

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const profilesMap = new Map<string, ProfileRow>();
  if (userIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, full_name, username, avatar_url")
      .in("user_id", userIds);
    (profs ?? []).forEach((p) => profilesMap.set(p.user_id, p as ProfileRow));
  }

  // Get current user's likes
  const { data: sess } = await supabase.auth.getSession();
  const myId = sess.session?.user?.id;
  const likedIds = new Set<string>();
  if (myId && rows.length) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", myId)
      .in("post_id", rows.map((r) => r.id));
    (likes ?? []).forEach((l) => likedIds.add(l.post_id));
  }

  const savedMap = getSavedMap();
  return rows.map((r) => rowToPost(r as PostRow, profilesMap.get(r.user_id), likedIds, savedMap));
}

export function usePosts() {
  const [posts, set] = useState<Post[]>([]);

  const refresh = useCallback(async () => {
    const next = await fetchPostsFromDb();
    set(next);
  }, []);

  useEffect(() => {
    refresh();
    const onSaved = () => {
      const savedMap = getSavedMap();
      set((prev) => prev.map((p) => ({ ...p, saved: !!savedMap[p.id] })));
    };
    const onPosts = () => refresh();
    window.addEventListener("loka:saved", onSaved);
    window.addEventListener("loka:posts", onPosts);

    // Realtime: refetch on any change to posts or likes
    const channel = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => refresh())
      .subscribe();

    return () => {
      window.removeEventListener("loka:saved", onSaved);
      window.removeEventListener("loka:posts", onPosts);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return posts;
}

export type CreatePostInput = {
  caption: string;
  title?: string;
  category?: string;
  price?: number;
  cityId: string;
  cityLabel: string;
  area?: string;
  hashtags?: string[];
  geo?: GeoPin;
  coverImage: string;
  images: string[];
  authorName: string;
};

export async function createPost(input: CreatePostInput): Promise<string | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      author_name: input.authorName,
      caption: input.caption,
      title: input.title ?? null,
      category: input.category ?? null,
      price: input.price ?? null,
      city_id: input.cityId,
      city_label: input.cityLabel,
      area: input.area ?? null,
      cover_image: input.coverImage,
      images: input.images,
      hashtags: input.hashtags ?? [],
      geo: input.geo ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  window.dispatchEvent(new Event("loka:posts"));
  return data.id;
}

export async function toggleLike(postId: string, currentlyLiked: boolean): Promise<boolean> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) return currentlyLiked;
  if (currentlyLiked) {
    const { error } = await supabase.from("post_likes").delete().match({ post_id: postId, user_id: userId });
    if (error) return currentlyLiked;
    return false;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error) return currentlyLiked;
    return true;
  }
}

export async function incrementShares(postId: string, current: number): Promise<void> {
  await supabase.from("posts").update({ shares_count: current + 1 }).eq("id", postId);
}

// ---------------- Comments (Supabase) ----------------
export type PostComment = { id: string; author: string; text: string; ts: number };

async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, author_name, text, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((c) => ({
    id: c.id,
    author: c.author_name,
    text: c.text,
    ts: new Date(c.created_at).getTime(),
  }));
}

export async function addPostComment(postId: string, text: string, author = "You") {
  const t = text.trim();
  if (!t) return;
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) return;
  await supabase.from("post_comments").insert({
    post_id: postId,
    user_id: userId,
    author_name: author,
    text: t,
  });
}

export function usePostComments(postId: string) {
  const [list, set] = useState<PostComment[]>([]);
  useEffect(() => {
    let cancel = false;
    fetchComments(postId).then((c) => !cancel && set(c));
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        async () => {
          const c = await fetchComments(postId);
          if (!cancel) set(c);
        },
      )
      .subscribe();
    return () => {
      cancel = true;
      supabase.removeChannel(channel);
    };
  }, [postId]);
  return list;
}

// ---------------- Chats (local) ----------------
const SEED_CHATS: Chat[] = [
  {
    id: "c1",
    peerName: "Sai Teja",
    peerCity: "Vijayawada",
    unread: 2,
    lastTs: Date.now() - 1000 * 60 * 9,
    messages: [
      { id: "m1", fromMe: false, text: "Hi, is the bike still available?", ts: Date.now() - 1000 * 60 * 30 },
      { id: "m2", fromMe: true, text: "Yes sir, available.", ts: Date.now() - 1000 * 60 * 22 },
      { id: "m3", fromMe: false, text: "Can I see it tomorrow evening?", ts: Date.now() - 1000 * 60 * 9 },
    ],
  },
];

export function getChats(): Chat[] {
  const stored = read<Chat[] | null>(KEY_CHATS, null);
  if (stored && stored.length) return stored;
  write(KEY_CHATS, SEED_CHATS);
  return SEED_CHATS;
}
export function saveChats(chats: Chat[]) {
  write(KEY_CHATS, chats);
  window.dispatchEvent(new Event("loka:chats"));
}
export function unreadCount(): number {
  return getChats().reduce((acc, c) => acc + c.unread, 0);
}
export function startChatWith(peerName: string, peerCity: string): string {
  const chats = getChats();
  const existing = chats.find((c) => c.peerName === peerName && c.peerCity === peerCity);
  if (existing) return existing.id;
  const id = `c_${Date.now()}`;
  const next: Chat = { id, peerName, peerCity, unread: 0, messages: [], lastTs: Date.now() };
  saveChats([next, ...chats]);
  return id;
}
export function sendMessage(chatId: string, text: string) {
  const chats = getChats().map((c) =>
    c.id === chatId
      ? {
          ...c,
          messages: [...c.messages, { id: `m_${Date.now()}`, fromMe: true, text, ts: Date.now() }],
          lastTs: Date.now(),
        }
      : c,
  );
  saveChats(chats);
}
export function markChatRead(chatId: string) {
  const chats = getChats().map((c) => (c.id === chatId ? { ...c, unread: 0 } : c));
  saveChats(chats);
}
export function useChats() {
  const [chats, set] = useState<Chat[]>([]);
  useEffect(() => {
    set(getChats());
    const fn = () => set(getChats());
    window.addEventListener("loka:chats", fn);
    return () => window.removeEventListener("loka:chats", fn);
  }, []);
  return chats;
}
export function useUnread() {
  const chats = useChats();
  return chats.reduce((acc, c) => acc + c.unread, 0);
}

export function cityLabel(cityId: string): string {
  return CITIES.find((c) => c.id === cityId)?.name ?? cityId;
}

// ---------------- Notifications ----------------
const SEED_NOTIFS: Notification[] = [
  {
    id: "n1",
    type: "message",
    title: "Sai Teja sent you a message",
    body: "Can I see it tomorrow evening?",
    ts: Date.now() - 1000 * 60 * 9,
    read: false,
    link: "/inbox",
  },
];

export function getNotifs(): Notification[] {
  const stored = read<Notification[] | null>(KEY_NOTIFS, null);
  if (stored) return stored;
  write(KEY_NOTIFS, SEED_NOTIFS);
  return SEED_NOTIFS;
}
function saveNotifs(list: Notification[]) {
  write(KEY_NOTIFS, list);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("loka:notifs"));
}
export function pushNotif(n: Omit<Notification, "id" | "ts" | "read">) {
  const full: Notification = { id: `n_${Date.now()}`, ts: Date.now(), read: false, ...n };
  saveNotifs([full, ...getNotifs()].slice(0, 100));
}
export function markNotifRead(id: string) {
  saveNotifs(getNotifs().map((n) => (n.id === id ? { ...n, read: true } : n)));
}
export function markAllNotifsRead() {
  saveNotifs(getNotifs().map((n) => ({ ...n, read: true })));
}
export function useNotifs() {
  const [list, set] = useState<Notification[]>([]);
  useEffect(() => {
    set(getNotifs());
    const fn = () => set(getNotifs());
    window.addEventListener("loka:notifs", fn);
    return () => window.removeEventListener("loka:notifs", fn);
  }, []);
  return list;
}
export function useUnreadNotifs() {
  return useNotifs().filter((n) => !n.read).length;
}

// ---------------- Ranking ----------------
export function rankPostsForUser<T extends Post>(posts: T[], user: User | null): T[] {
  if (!user) return posts;
  const city = CITIES.find((c) => c.id === user.cityId);
  const userArea = (user.area ?? "").toLowerCase();
  const score = (p: T) => {
    const label = p.cityLabel.toLowerCase();
    const area = (p.area ?? "").toLowerCase();
    if (userArea && (area === userArea || label.includes(userArea))) return 0;
    if (p.cityId === user.cityId) return 1;
    if (city?.nearby.some((n) => p.cityLabel.includes(n))) return 2;
    return 3;
  };
  return [...posts].sort((a, b) => score(a) - score(b) || b.createdAt - a.createdAt);
}

export function distanceLabel(p: Post, user: User | null): string {
  if (!user) return "";
  const userArea = (user.area ?? "").toLowerCase();
  const area = (p.area ?? "").toLowerCase();
  if (userArea && (area === userArea || p.cityLabel.toLowerCase().includes(userArea))) {
    return "Near you";
  }
  if (p.cityId === user.cityId) return "In your city";
  const city = CITIES.find((c) => c.id === user.cityId);
  if (city?.nearby.some((n) => p.cityLabel.includes(n))) return "Nearby town";
  return "";
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function useForceRerender() {
  const [, set] = useState(0);
  return useCallback(() => set((v) => v + 1), []);
}
