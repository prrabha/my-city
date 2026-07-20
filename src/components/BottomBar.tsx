import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  MessageCircle,
  LayoutGrid,
  ArrowUp,
  X,
  Sparkles,
  Film,
  HeartPulse,
  Newspaper,
  Cpu,
  Briefcase,
  ShoppingBag,
  Trophy,
  Sun,
  ShieldAlert,
  Flame,
  Landmark,
  MapPin,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUnread } from "@/lib/store";

const EXTRA_CATEGORIES: { label: string; query: string; icon: React.ComponentType<{ className?: string }>; tint: string }[] = [
  { label: "Lifestyle", query: "lifestyle", icon: Sparkles, tint: "bg-pink-100 text-pink-600" },
  { label: "Cinema", query: "cinema movies", icon: Film, tint: "bg-purple-100 text-purple-600" },
  { label: "Health", query: "health", icon: HeartPulse, tint: "bg-red-100 text-red-600" },
  { label: "Interesting News Facts", query: "interesting news facts", icon: Newspaper, tint: "bg-amber-100 text-amber-600" },
  { label: "Technology", query: "technology", icon: Cpu, tint: "bg-blue-100 text-blue-600" },
  { label: "Business", query: "business", icon: Briefcase, tint: "bg-slate-100 text-slate-700" },
  { label: "Buy / Sell", query: "buy sell", icon: ShoppingBag, tint: "bg-emerald-100 text-emerald-600" },
  { label: "Sports", query: "sports", icon: Trophy, tint: "bg-orange-100 text-orange-600" },
  { label: "Spiritual Content", query: "spiritual", icon: Sun, tint: "bg-yellow-100 text-yellow-700" },
  { label: "Crime", query: "crime", icon: ShieldAlert, tint: "bg-rose-100 text-rose-600" },
  { label: "Viral Content", query: "viral", icon: Flame, tint: "bg-fuchsia-100 text-fuchsia-600" },
  { label: "Politics", query: "politics", icon: Landmark, tint: "bg-indigo-100 text-indigo-600" },
  { label: "State News", query: "state news", icon: MapPin, tint: "bg-teal-100 text-teal-600" },
];


export function BottomBar() {
  const navigate = useNavigate();
  const router = useRouterState();
  const unread = useUnread();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when the search expands
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Collapse on outside tap
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: PointerEvent) => {
      const el = searchContainerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [searchOpen]);

  // Collapse on back button (history)
  useEffect(() => {
    if (!searchOpen) return;
    window.history.pushState({ lokaSearch: true }, "");
    const onPop = () => setSearchOpen(false);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.lokaSearch) {
        window.history.back();
      }
    };
  }, [searchOpen]);

  const onSearch = (e?: FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    navigate({ to: "/search", search: { q: query } });
    setSearchOpen(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
    if (e.key === "Escape") setSearchOpen(false);
  };

  const inboxActive = router.location.pathname.startsWith("/inbox");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 safe-bottom">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 p-2">
        <div
          ref={searchContainerRef}
          className={`relative transition-all duration-300 ease-out ${
            searchOpen ? "flex-1" : "w-11 flex-none"
          }`}
        >
          {!searchOpen && (
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="tap flex h-11 w-11 items-center justify-center rounded-full bg-white text-foreground shadow-soft animate-fade-in"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
          {searchOpen && (
            <form
              onSubmit={onSearch}
              className="relative flex h-11 w-full items-center rounded-full bg-secondary pl-4 pr-1 animate-fade-in"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search local jobs, rent, offers…"
                type="search"
                enterKeyHint="search"
                className="h-full w-full min-w-0 bg-transparent px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search"
              />
              {q ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQ("");
                    searchInputRef.current?.focus();
                  }}
                  className="tap mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/60"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="tap mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/60"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-soft disabled:opacity-40"
                disabled={!q.trim()}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </form>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCatOpen(true)}
          aria-label="Categories"
          className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={2} />
        </button>


        <Link
          to="/inbox"
          aria-label="Inbox"
          className={`tap relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-soft ${
            inboxActive ? "text-primary" : "text-foreground"
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-soft">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>

      <Sheet open={catOpen} onOpenChange={setCatOpen}>
        <SheetContent
          side="right"
          className="w-40 border-0 bg-background/95 p-0 shadow-2xl backdrop-blur-sm sm:w-44"
        >
          <SheetHeader className="border-b border-border/60 px-3 py-3">
            <SheetTitle className="text-left text-base font-bold">Categories</SheetTitle>
          </SheetHeader>
          <div className="max-h-[calc(100dvh-52px)] overflow-y-auto px-2 py-2">
            <ul className="space-y-1">
              {EXTRA_CATEGORIES.map(({ label, query, icon: Icon, tint }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => {
                      setCatOpen(false);
                      navigate({ to: "/search", search: { q: query } });
                    }}
                    className="tap flex w-full items-center gap-2 rounded-xl bg-white px-2 py-2 text-left shadow-soft hover:bg-secondary/60"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-xs font-semibold leading-tight text-foreground">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

