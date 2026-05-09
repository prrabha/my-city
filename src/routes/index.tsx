import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Bell, Menu, UserCircle2, X } from "lucide-react";
import { BottomBar } from "@/components/BottomBar";
import { PostCard } from "@/components/PostCard";
import { LocationGate } from "@/components/LocationGate";
import { rankPostsForUser, usePosts, useUnreadNotifs, useUser, type Post } from "@/lib/store";
import catShop from "@/assets/cat-shop.png";
import catHome from "@/assets/cat-home.png";
import catJobs from "@/assets/cat-jobs.png";
import catProperty from "@/assets/cat-property.png";

type CatKey = "shop" | "home" | "jobs" | "property";

const CATEGORIES: { key: CatKey; label: string; image: string; keywords: string[] }[] = [
  { key: "shop", label: "RENT SHOP", image: catShop, keywords: ["shop", "store", "stall"] },
  { key: "home", label: "RENT HOME", image: catHome, keywords: ["rent house", "rent home", "room", "pg ", "flat", "apartment"] },
  { key: "jobs", label: "JOBS", image: catJobs, keywords: ["job", "hiring", "vacancy", "wanted", "work"] },
  { key: "property", label: "PROPERTYS", image: catProperty, keywords: ["property", "plot", "land", "building", "office"] },
];

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    cat: (s.cat as CatKey | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [
      { title: "Loka — Local feed near you" },
      {
        name: "description",
        content:
          "Browse fresh local posts from your city — rent shops, homes, jobs and properties nearby.",
      },
    ],
  }),
  component: Home,
});

function matchesCategory(p: Post, key: CatKey): boolean {
  const cat = CATEGORIES.find((c) => c.key === key)!;
  const hay = `${p.caption} ${p.category ?? ""}`.toLowerCase();
  return cat.keywords.some((k) => hay.includes(k));
}

function Home() {
  const user = useUser();
  const navigate = useNavigate();
  const posts = usePosts();
  const unreadNotifs = useUnreadNotifs();
  const { cat } = Route.useSearch();

  useEffect(() => {
    if (typeof window !== "undefined" && !user) {
      // only redirect after we've hydrated and confirmed no user
      const t = setTimeout(() => {
        if (!localStorage.getItem("loka:user")) navigate({ to: "/auth" });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  const ranked = useMemo(() => rankPostsForUser(posts, user), [posts, user]);
  const filtered = useMemo(
    () => (cat ? ranked.filter((p) => matchesCategory(p, cat)) : ranked),
    [ranked, cat],
  );
  const activeCat = cat ? CATEGORIES.find((c) => c.key === cat) : null;

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background pb-32">
      <LocationGate />
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <button
            aria-label="Profile"
            className="tap flex h-10 w-10 items-center justify-center rounded-full text-foreground"
          >
            <UserCircle2 className="h-7 w-7" strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-1">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="tap relative flex h-10 w-10 items-center justify-center rounded-full text-foreground"
            >
              <Bell className="h-6 w-6" strokeWidth={1.75} />
              {unreadNotifs > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-soft">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Link>
            <button
              aria-label="Menu"
              className="tap flex h-10 w-10 items-center justify-center rounded-full text-foreground"
            >
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-4">
        {/* Heading */}
        <h1 className="px-1 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          what you want today ?
        </h1>

        {/* Category grid */}
        <section className="mt-5 grid grid-cols-2 gap-3.5">
          {CATEGORIES.map((c) => {
            const active = cat === c.key;
            return (
              <button
                key={c.key}
                onClick={() =>
                  navigate({ to: "/", search: active ? {} : { cat: c.key } })
                }
                aria-pressed={active}
                className={`tap group relative flex aspect-square flex-col items-center justify-between overflow-hidden rounded-3xl bg-gradient-primary p-3 text-primary-foreground shadow-card transition-shadow hover:shadow-glow ${
                  active ? "ring-4 ring-primary/40" : ""
                }`}
              >
                <span className="self-stretch text-center text-base font-extrabold tracking-wide drop-shadow-sm sm:text-lg">
                  {c.label}
                </span>
                <div className="flex flex-1 items-center justify-center w-full">
                  <img
                    src={c.image}
                    alt={c.label}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-full max-h-[110px] w-auto object-contain transition-transform duration-300 group-active:scale-95 group-hover:scale-105"
                  />
                </div>
              </button>
            );
          })}
        </section>

        {/* Feed header */}
        <div className="mt-6 flex items-center justify-between px-1">
          <div className="text-sm font-semibold">
            {activeCat ? `${activeCat.label} near you` : "Latest near you"}
          </div>
          {activeCat && (
            <button
              onClick={() => navigate({ to: "/", search: {} })}
              className="tap inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Feed */}
        <div className="mt-3 flex flex-col gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center shadow-soft">
              <div className="text-sm font-semibold">
                No {activeCat?.label.toLowerCase()} posts yet
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Be the first to post in your city.
              </div>
            </div>
          ) : (
            filtered.map((p) => <PostCard key={p.id} post={p} />)
          )}
          <div className="py-6 text-center text-xs text-muted-foreground">
            You're all caught up ✨
          </div>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
