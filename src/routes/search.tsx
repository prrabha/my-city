import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { rankPostsForUser, usePosts, useUser } from "@/lib/store";
import { BottomBar } from "@/components/BottomBar";

const SUGGESTIONS = [
  "jobs",
  "bike sale",
  "plumber",
  "rent house",
  "restaurant",
  "offers",
  "tuition",
  "electrician",
];

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) ?? "" }),
  head: () => ({ meta: [{ title: "Search — Loka" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);
  const posts = usePosts();
  const user = useUser();

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return [];
    const filtered = posts.filter((p) =>
      [p.caption, p.category ?? "", p.authorName, p.cityLabel]
        .join(" ")
        .toLowerCase()
        .includes(text),
    );
    return rankPostsForUser(filtered, user);
  }, [query, posts, user]);

  return (
    <div className="min-h-dvh bg-gradient-warm pb-32">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-3">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Back"
            className="tap flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-11 flex-1 items-center rounded-full bg-secondary pl-4 pr-3">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search local…"
              className="h-full w-full bg-transparent px-2 text-sm focus:outline-none"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-3 py-4">
        {!query.trim() ? (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trending near you
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="tap rounded-full bg-card px-4 py-2 text-sm font-medium shadow-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-sm font-semibold">No results for "{query}"</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Try another keyword like "rent", "bike" or "offers"
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} for "{query}"
            </div>
            {results.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </main>

      <BottomBar />
    </div>
  );
}
