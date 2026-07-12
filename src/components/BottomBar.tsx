import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Plus, Search, MessageCircle, Camera, Image as ImageIcon, ArrowUp, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUnread } from "@/lib/store";
import { toast } from "sonner";

function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BottomBar() {
  const navigate = useNavigate();
  const router = useRouterState();
  const unread = useUnread();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
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

  const handlePicked = async (
    e: ChangeEvent<HTMLInputElement>,
    source: "camera" | "gallery",
  ) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    try {
      const imgs = await Promise.all(files.slice(0, 10).map((f) => compressImage(f)));
      try {
        sessionStorage.setItem("loka:pendingImages", JSON.stringify(imgs));
      } catch {
        toast.error("Images too large to stage. Try fewer photos.");
        return;
      }
      setOpen(false);
      navigate({ to: "/create", search: { source } });
    } catch {
      toast.error("Couldn't read the selected image");
    }
  };

  const inboxActive = router.location.pathname.startsWith("/inbox");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 safe-bottom">
      {/* Hidden inputs — clicked synchronously from the user-gesture handlers below */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handlePicked(e, "camera")}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handlePicked(e, "gallery")}
      />

      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 p-2">
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
                type="button"
                className="tap flex flex-col items-center gap-2 rounded-2xl bg-secondary p-6"
                onClick={() => cameraRef.current?.click()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Camera</span>
              </button>
              <button
                type="button"
                className="tap flex flex-col items-center gap-2 rounded-2xl bg-secondary p-6"
                onClick={() => galleryRef.current?.click()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Gallery</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

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
