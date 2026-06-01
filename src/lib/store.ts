// Lightweight client store for the demo: auth, posts, chats. Persists to localStorage.
import { useEffect, useState, useCallback } from "react";
import marketImg from "@/assets/feed-market.jpg";
import bikeImg from "@/assets/feed-bike.jpg";
import roomImg from "@/assets/feed-room.jpg";
import electricianImg from "@/assets/feed-electrician.jpg";
import chickenImg from "@/assets/feed-chicken.jpg";

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
  area?: string; // locality, e.g. "Wyra"
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
  authorName: string;
  authorMobile: string;
  cityId: string;
  cityLabel: string;
  area?: string;
  image: string; // primary/cover image (kept for back-compat)
  images?: string[]; // optional multi-image gallery
  caption: string;
  hashtags?: string[];
  category?: string;
  title?: string;
  price?: number;
  createdAt: number;
  likes: number;
  liked?: boolean;
  saved?: boolean;
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
  link?: string; // app path to open
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
const KEY_POSTS = "loka:posts";
const KEY_CHATS = "loka:chats";
const KEY_NOTIFS = "loka:notifs";

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

const SEED_POSTS: Post[] = [
  {
    id: "p1",
    authorName: "Ravi Kumar",
    authorMobile: "9000000001",
    cityId: "khammam",
    cityLabel: "Khammam",
    image: marketImg,
    caption: "Fresh vegetables at wholesale price 🍅 Visit our shop near bus stand. Open 6 AM – 10 PM.",
    category: "offers",
    createdAt: Date.now() - 1000 * 60 * 22,
    likes: 124,
  },
  {
    id: "p2",
    authorName: "Sai Teja",
    authorMobile: "9000000002",
    cityId: "vijayawada",
    cityLabel: "Vijayawada",
    image: bikeImg,
    caption: "Honda Activa 6G for sale. 2022 model, single owner, 12,000 km. Price ₹62,000 (negotiable).",
    category: "bike sale",
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    likes: 56,
  },
  {
    id: "p3",
    authorName: "Lakshmi Devi",
    authorMobile: "9000000003",
    cityId: "khammam",
    cityLabel: "Wyra, Khammam",
    image: roomImg,
    caption: "Single room for rent near college. Furnished, attached bath, ₹4,500/month. Bachelors welcome.",
    category: "rent house",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    likes: 31,
  },
  {
    id: "p4",
    authorName: "Mahesh Electricals",
    authorMobile: "9000000004",
    cityId: "khammam",
    cityLabel: "Khammam",
    image: electricianImg,
    caption: "Certified electrician available 24/7. Wiring, fan, AC, inverter — call anytime.",
    category: "plumber",
    createdAt: Date.now() - 1000 * 60 * 60 * 14,
    likes: 88,
  },
  {
    id: "p5",
    authorName: "Hot Chick Center",
    authorMobile: "9000000005",
    cityId: "vijayawada",
    cityLabel: "Vijayawada",
    image: chickenImg,
    caption: "Sunday Special! Chicken broast combo @ ₹199 only. Free home delivery within 5 km.",
    category: "offers",
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    likes: 212,
  },
];

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
  {
    id: "c2",
    peerName: "Lakshmi Devi",
    peerCity: "Wyra, Khammam",
    unread: 0,
    lastTs: Date.now() - 1000 * 60 * 60 * 2,
    messages: [
      { id: "m1", fromMe: true, text: "Is the room still free?", ts: Date.now() - 1000 * 60 * 60 * 2 },
    ],
  },
];

export function getUser(): User | null {
  return read<User | null>(KEY_USER, null);
}
export function setUser(u: User | null) {
  if (u) write(KEY_USER, u);
  else if (typeof window !== "undefined") localStorage.removeItem(KEY_USER);
  window.dispatchEvent(new Event("loka:user"));
}

export function getPosts(): Post[] {
  const stored = read<Post[] | null>(KEY_POSTS, null);
  if (stored && stored.length) return stored;
  write(KEY_POSTS, SEED_POSTS);
  return SEED_POSTS;
}
export function savePosts(posts: Post[]) {
  write(KEY_POSTS, posts);
  window.dispatchEvent(new Event("loka:posts"));
}
export function addPost(p: Post) {
  const posts = [p, ...getPosts()];
  savePosts(posts);
}
export function togglePostLike(id: string) {
  const posts = getPosts().map((p) =>
    p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
  );
  savePosts(posts);
}
export function togglePostSave(id: string) {
  const posts = getPosts().map((p) => (p.id === id ? { ...p, saved: !p.saved } : p));
  savePosts(posts);
}

// ---------- Comments ----------
export type PostComment = { id: string; author: string; text: string; ts: number };
const KEY_COMMENTS = "loka:comments";
type CommentsMap = Record<string, PostComment[]>;

export function getComments(postId: string): PostComment[] {
  const map = read<CommentsMap>(KEY_COMMENTS, {});
  return map[postId] ?? [];
}
export function addPostComment(postId: string, text: string, author = "You") {
  const t = text.trim();
  if (!t) return;
  const map = read<CommentsMap>(KEY_COMMENTS, {});
  const list = map[postId] ?? [];
  const next: PostComment = { id: `c_${Date.now()}`, author, text: t, ts: Date.now() };
  map[postId] = [...list, next];
  write(KEY_COMMENTS, map);
  window.dispatchEvent(new Event("loka:comments"));
}
export function usePostComments(postId: string) {
  const [list, set] = useState<PostComment[]>([]);
  useEffect(() => {
    set(getComments(postId));
    const fn = () => set(getComments(postId));
    window.addEventListener("loka:comments", fn);
    return () => window.removeEventListener("loka:comments", fn);
  }, [postId]);
  return list;
}

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

export function cityLabel(cityId: string): string {
  return CITIES.find((c) => c.id === cityId)?.name ?? cityId;
}

// React hooks — initialize empty/null on first render so SSR & client match,
// then hydrate from localStorage inside an effect.
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

export function usePosts() {
  const [posts, set] = useState<Post[]>([]);
  useEffect(() => {
    set(getPosts());
    const fn = () => set(getPosts());
    window.addEventListener("loka:posts", fn);
    return () => window.removeEventListener("loka:posts", fn);
  }, []);
  return posts;
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

// ---------- Notifications ----------
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
  {
    id: "n2",
    type: "rent",
    title: "New rent home near you",
    body: "Single room ₹4,500/month — Wyra, Khammam",
    ts: Date.now() - 1000 * 60 * 60 * 2,
    read: false,
    link: "/?cat=home",
  },
  {
    id: "n3",
    type: "nearby",
    title: "Fresh post in your city",
    body: "Wholesale vegetables near bus stand",
    ts: Date.now() - 1000 * 60 * 60 * 8,
    read: true,
    link: "/",
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

// ---------- Ranking with area awareness ----------
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
