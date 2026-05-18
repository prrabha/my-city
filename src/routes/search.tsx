import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search as SearchIcon, Sparkles, MapPin } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { usePosts, useUser, CITIES } from "@/lib/store";
import { smartSearch, SMART_SUGGESTIONS } from "@/lib/smartSearch";
import { BottomBar } from "@/components/BottomBar";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) ?? "" }),
  head: () => ({ meta: [{ title: "Search — Loka" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);
  const [debounced, setDebounced] = useState(q);
  const posts = usePosts();
  const user = useUser();

  // Debounce input for smooth typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const { parsed, results } = useMemo(
    () => smartSearch(posts, debounced, user),
    [debounced, posts, user],
  );

  const liveSuggestions = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t || t.length < 2) return [];
    return SMART_SUGGESTIONS.filter((s) => s.toLowerCase().includes(t)).slice(0, 4);
  }, [query]);

  const cityName = parsed.cityId ? CITIES.find((c) => c.id === parsed.cityId)?.name : null;

  return (
    <div className="min-h-dvh bg-gradient-warm pb-32">
      <header className="sticky top-0 z-30">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-3">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Back"
            className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDebounced(query);
            }}
            className="flex h-11 flex-1 items-center rounded-full bg-secondary pl-4 pr-1"
          >
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: jobs near me, rent shops Warangal…"
              enterKeyHint="search"
              className="h-full w-full bg-transparent px-2 text-sm focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="tap flex h-9 w-9 items-center justify-center rounded-full text-foreground"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
        {liveSuggestions.length > 0 && (
          <div className="mx-auto max-w-xl px-3 pb-3">
            <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
              {liveSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    setDebounced(s);
                  }}
                  className="tap flex w-full items-center gap-2 border-b border-border/40 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-secondary"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-xl px-3 py-4">
        {!query.trim() ? (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Try smart searches
            </div>
            <div className="flex flex-col gap-2">
              {SMART_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    setDebounced(s);
                  }}
                  className="tap flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left text-sm font-medium shadow-soft"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-sm font-semibold">No matching posts found</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Try another city or keyword
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SMART_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    setDebounced(s);
                  }}
                  className="tap rounded-full bg-card px-4 py-2 text-xs font-medium shadow-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
              {parsed.category && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  {parsed.category.replace("_", " ")}
                </span>
              )}
              {(cityName || parsed.nearMe) && (
                <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
                  <MapPin className="h-3 w-3" />
                  {cityName ?? "Near you"}
                </span>
              )}
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
