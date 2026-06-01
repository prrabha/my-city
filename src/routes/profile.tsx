import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, UserRound, MapPin, Mailbox, Heart } from "lucide-react";
import { useUser, usePosts } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Loka" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const user = useUser();
  const posts = usePosts();
  const myPosts = user ? posts.filter((p) => p.authorName === user.name) : [];
  const saved = posts.filter((p) => p.saved);

  const name = user?.name ?? "Guest";
  const city = user?.cityId ? user.cityId.charAt(0).toUpperCase() + user.cityId.slice(1) : "—";
  const initial = name.charAt(0).toUpperCase();

  const items = [
    { label: "Edit Profile", icon: <UserRound className="h-5 w-5 text-blue-500" />, tint: "bg-blue-50", to: "/profile" },
    { label: "Change City", icon: <MapPin className="h-5 w-5 text-red-500" />, tint: "bg-blue-50", to: "/profile" },
    { label: "My Posts", icon: <Mailbox className="h-5 w-5 text-blue-600" />, tint: "bg-orange-50", to: "/profile" },
    { label: "Saved Items", icon: <Heart className="h-5 w-5 fill-red-500 text-red-500" />, tint: "bg-purple-50", to: "/profile" },
  ];

  return (
    <div className="min-h-dvh bg-[#f5f0e6] pb-24">
      {/* Orange hero */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-orange-500 to-orange-600 px-4 pb-8 pt-4 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-16 top-16 h-24 w-24 rounded-full bg-white/10" />
        <button
          onClick={() => (history.length > 1 ? history.back() : navigate({ to: "/" }))}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button className="tap absolute right-4 top-4 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
          Edit
        </button>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-5xl font-bold ring-4 ring-white/30">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-extrabold leading-tight">{name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/90">
              <span>📍</span> {city} · Since 2024
            </p>
            <div className="mt-3 flex items-end gap-5">
              <Stat n={myPosts.length} label="Posts" />
              <Stat n={saved.length} label="Saved" />
              <Stat n={"4.9★"} label="Rating" />
            </div>
          </div>
        </div>
      </div>

      {/* Menu card */}
      <div className="mx-4 mt-5 overflow-hidden rounded-3xl bg-white shadow-soft">
        {items.map((it, i) => (
          <Link
            key={it.label}
            to={it.to}
            className={`tap flex items-center gap-3 px-4 py-4 ${
              i !== items.length - 1 ? "border-b border-border/60" : ""
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${it.tint}`}>
              {it.icon}
            </div>
            <span className="flex-1 text-base font-bold text-foreground">{it.label}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <div className="mx-4 mt-4">
        <Link
          to="/settings"
          className="tap flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-soft"
        >
          Open Settings →
        </Link>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="leading-tight">
      <div className="text-xl font-extrabold">{n}</div>
      <div className="text-[11px] text-white/85">{label}</div>
    </div>
  );
}
