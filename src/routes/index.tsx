import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Bell, MapPin } from "lucide-react";
import { BottomBar } from "@/components/BottomBar";
import { PostCard } from "@/components/PostCard";
import { cityLabel, rankPostsForUser, usePosts, useUser } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loka — Local feed near you" },
      {
        name: "description",
        content:
          "Browse fresh local posts from your city and nearby villages — jobs, services, offers and more.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const user = useUser();
  const navigate = useNavigate();
  const posts = usePosts();

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  const ranked = useMemo(() => rankPostsForUser(posts, user), [posts, user]);

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-gradient-warm pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Loka feed
            </div>
            <div className="flex items-center gap-1 text-base font-bold">
              <MapPin className="h-4 w-4 text-primary" />
              {cityLabel(user.cityId)}
            </div>
          </div>
          <button
            aria-label="Notifications"
            className="tap relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      {/* Feed */}
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-3 py-4">
        {ranked.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        <div className="py-6 text-center text-xs text-muted-foreground">
          You're all caught up ✨
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
