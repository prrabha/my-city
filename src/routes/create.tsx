import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, MapPin, Sparkles, X, GripVertical } from "lucide-react";
import { addPost, cityLabel, useUser, type Post, type GeoPin } from "@/lib/store";
import { MapPicker } from "@/components/MapPicker";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    source: (s.source as "camera" | "gallery" | undefined) ?? "gallery",
  }),
  head: () => ({ meta: [{ title: "Create a post — Loka" }] }),
  component: CreatePage,
});

const PLACEHOLDERS = [
  "Need worker urgently",
  "Bike for sale — single owner",
  "Chicken center weekend offer",
  "Electrician available 24/7",
  "Single room for rent near college",
];

const MAX_IMAGES = 8;

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

function extractHashtags(text: string): string[] {
  const set = new Set<string>();
  const re = /#([\p{L}0-9_]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) set.add(m[1].toLowerCase());
  return Array.from(set);
}

function CreatePage() {
  const navigate = useNavigate();
  const user = useUser();
  const { source } = Route.useSearch();
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [geo, setGeo] = useState<GeoPin | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);
  const placeholder = useMemo(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
    [],
  );
  const hashtags = useMemo(() => extractHashtags(caption), [caption]);

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.click(), 200);
    return () => clearTimeout(t);
  }, []);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Max ${MAX_IMAGES} images per post`);
      e.target.value = "";
      return;
    }
    const picked = files.slice(0, room);
    try {
      const out = await Promise.all(picked.map((f) => compressImage(f)));
      setImages((prev) => [...prev, ...out]);
    } catch {
      toast.error("Couldn't read one of the images");
    }
    e.target.value = "";
  };

  const removeAt = (i: number) => setImages((prev) => prev.filter((_, j) => j !== i));
  const moveTo = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  const upload = async () => {
    if (!user || submitting) return;
    if (!images.length) return toast.error("Please pick at least one image");
    if (caption.trim().length < 4) return toast.error("Add a short description");
    setSubmitting(true);
    try {
      const p: Post = {
        id: `p_${Date.now()}`,
        authorName: user.name,
        authorMobile: user.mobile,
        cityId: user.cityId,
        cityLabel: user.area
          ? `${user.area}, ${cityLabel(user.cityId)}`
          : cityLabel(user.cityId),
        area: geo?.area ?? user.area,
        image: images[0],
        images,
        caption: caption.trim(),
        hashtags,
        createdAt: Date.now(),
        likes: 0,
        geo: geo ?? undefined,
      };
      addPost(p);
      toast.success("Posted to your local feed");
      navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background pb-32">
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">New post</h1>
        <div className="w-10" />
      </header>

      <div className="mx-auto max-w-xl px-4 pt-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture={source === "camera" ? "environment" : undefined}
          className="hidden"
          onChange={onFiles}
        />

        {images.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="tap flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-secondary/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              <ImagePlus className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">Pick photos</div>
            <div className="text-xs text-muted-foreground">
              Up to {MAX_IMAGES} images · JPG / PNG
            </div>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-3xl bg-muted shadow-card">
              <img src={images[0]} alt="Cover" className="aspect-square w-full object-cover" />
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </div>
              <button
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-soft"
              >
                Add more
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {images.map((src, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => (dragIdx.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx.current != null) moveTo(dragIdx.current, i);
                    dragIdx.current = null;
                  }}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      COVER
                    </span>
                  )}
                  <button
                    onClick={() => removeAt(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="pointer-events-none absolute bottom-0 left-0 flex items-center gap-0.5 rounded-tr-md bg-black/55 px-1 py-0.5 text-[9px] text-white">
                    <GripVertical className="h-2.5 w-2.5" /> drag
                  </div>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground"
                  aria-label="Add more"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Description & hashtags
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`${placeholder}\n\n#jobs #khammam #renthome`}
            rows={6}
            maxLength={1500}
            className="w-full resize-none bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
          />
          {hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  #{h}
                </span>
              ))}
            </div>
          )}
          <div className="text-right text-[11px] text-muted-foreground">
            {caption.length}/1500
          </div>
        </div>

        {/* Map */}
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Location
            </div>
            {geo && (
              <button
                onClick={() => {
                  setGeo(null);
                  setShowMap(false);
                }}
                className="text-[11px] font-medium text-muted-foreground"
              >
                Remove
              </button>
            )}
          </div>
          {!showMap && !geo ? (
            <button
              onClick={() => setShowMap(true)}
              className="tap flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm font-semibold"
            >
              <MapPin className="h-4 w-4 text-primary" /> Add Map (auto-detect)
            </button>
          ) : (
            <MapPicker
              initial={geo}
              onChange={(g) => {
                setGeo(g);
                setShowMap(true);
              }}
            />
          )}
        </div>

        <button
          onClick={upload}
          disabled={submitting}
          className="tap mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {submitting ? "Publishing…" : "Finish & publish"}
        </button>
      </div>
    </div>
  );
}
