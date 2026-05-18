import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Plus, Search, MessageCircle, Camera, Image as ImageIcon, ArrowUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUnread } from "@/lib/store";

export function BottomBar() {
  const navigate = useNavigate();
  const router = useRouterState();
  const unread = useUnread();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const onSearch = (e?: FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate({ to: "/search", search: { q: query } });
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const inboxActive = router.location.pathname.startsWith("/inbox");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 safe-bottom">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 p-2">
        {/* Plus */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Create post"
              className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-0 pb-8">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-center">Create a post</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 px-2 pt-2">
              <button
                className="tap flex flex-col items-center gap-2 rounded-2xl bg-secondary p-6"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/create", search: { source: "camera" } });
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Camera</span>
              </button>
              <button
                className="tap flex flex-col items-center gap-2 rounded-2xl bg-secondary p-6"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/create", search: { source: "gallery" } });
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Gallery</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search */}
        <form
          onSubmit={onSearch}
          className="relative flex h-11 flex-1 items-center rounded-full bg-secondary pl-4 pr-1"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search local jobs, rent, offers…"
            className="h-full w-full bg-transparent px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
          />
          <button
            type="submit"
            aria-label="Search"
            className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-soft disabled:opacity-40"
            disabled={!q.trim()}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>

        {/* Inbox */}
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
    </div>
  );
}
