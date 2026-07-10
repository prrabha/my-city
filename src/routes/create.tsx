import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, MapPin, X, ChevronRight, ChevronDown } from "lucide-react";
import {
  cityLabel,
  CITIES,
  createPost,
  hydrateUserFromSession,
  useUser,
  type GeoPin,
  type User,
} from "@/lib/store";
import { uploadPostImage } from "@/lib/avatar";
import { MapPicker } from "@/components/MapPicker";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    source: (s.source as "camera" | "gallery" | undefined) ?? "gallery",
  }),
  head: () => ({ meta: [{ title: "Create a post — Loka" }] }),
  component: CreatePage,
});

const CATEGORIES = [
  "Jobs",
  "Rent House",
  "Bike Sale",
  "Car Sale",
  "Offers",
  "Services",
  "Electronics",
  "Furniture",
  "Real Estate",
  "Education",
  "Food",
  "Other",
];

const MAX_IMAGES = 10;

function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
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
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("blob"))),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractKeywords(title: string, description: string, category: string, city: string): string[] {
  const text = `${title} ${description} ${category} ${city}`.toLowerCase();
  const stop = new Set([
    "the", "and", "for", "with", "your", "this", "that", "from", "have", "are",
    "you", "our", "out", "any", "all", "one", "two", "near", "into", "will",
  ]);
  const words = text
    .replace(/[^\p{L}0-9\s#]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^#/, "").trim())
    .filter((w) => w.length >= 3 && !stop.has(w));
  return Array.from(new Set(words)).slice(0, 10);
}

type StagedImage = { previewUrl: string; blob: Blob };

function CreatePage() {
  const navigate = useNavigate();
  const user = useUser();
  const [restoredUser, setRestoredUser] = useState<User | null>(null);
  const currentUser = user ?? restoredUser;
  const { source } = Route.useSearch();
  const [images, setImages] = useState<StagedImage[]>([]);
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cityId, setCityId] = useState<string>(user?.cityId ?? "khammam");
  const [geo, setGeo] = useState<GeoPin | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pickerBootstrapped, setPickerBootstrapped] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const keywords = useMemo(
    () => extractKeywords(title, description, category, cityLabel(cityId)),
    [title, description, category, cityId],
  );

  useEffect(() => {
    let cancelled = false;

    const checkActiveSession = async () => {
      if (user) {
        setRestoredUser(null);
        setAuthChecked(true);
        return;
      }

      const restored = await hydrateUserFromSession();
      if (cancelled) return;

      if (restored) {
        setRestoredUser(restored);
        setAuthChecked(true);
        return;
      }

      setAuthChecked(true);
      navigate({ to: "/auth" });
    };

    checkActiveSession();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  // Consume images staged from BottomBar (dataURL strings) and auto-open picker if none.
  useEffect(() => {
    if (!currentUser || pickerBootstrapped) return;
    setPickerBootstrapped(true);

    let staged: string[] = [];
    try {
      const raw = sessionStorage.getItem("loka:pendingImages");
      if (raw) {
        staged = JSON.parse(raw) as string[];
        sessionStorage.removeItem("loka:pendingImages");
      }
    } catch {
      /* ignore */
    }
    if (staged.length) {
      Promise.all(
        staged.map(async (dataUrl) => {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          return { previewUrl: URL.createObjectURL(blob), blob } as StagedImage;
        }),
      )
        .then((out) => setImages((prev) => [...prev, ...out].slice(0, MAX_IMAGES)))
        .catch(() => toast.error("Couldn't load selected photos"));
    } else {
      // Auto-open the file picker so tapping Camera/Gallery from the bottom bar
      // takes the user straight into their camera / photo library.
      setTimeout(() => fileRef.current?.click(), 60);
    }
  }, [currentUser, pickerBootstrapped]);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Max ${MAX_IMAGES} images per post`);
      e.target.value = "";
      return;
    }
    try {
      const out = await Promise.all(
        files.slice(0, room).map(async (f) => {
          const blob = await compressImage(f);
          return { previewUrl: URL.createObjectURL(blob), blob } as StagedImage;
        }),
      );
      setImages((prev) => [...prev, ...out]);
    } catch {
      toast.error("Couldn't read one of the images");
    }
    e.target.value = "";
  };

  const removeAt = (i: number) =>
    setImages((prev) => {
      const next = prev.filter((_, j) => j !== i);
      URL.revokeObjectURL(prev[i].previewUrl);
      return next;
    });

  const upload = async () => {
    if (!currentUser || submitting) return;
    if (!images.length) return toast.error("Please add at least one photo");
    if (!category) return toast.error("Please choose a category");
    if (title.trim().length < 3) return toast.error("Add a short title");
    if (description.trim().length < 4) return toast.error("Add a description");
    setSubmitting(true);
    try {
      // Upload all images to storage
      const urls = await Promise.all(images.map((s) => uploadPostImage(s.blob, "image.jpg")));
      if (urls.some((u) => !u)) {
        toast.error("Image upload failed. Please try again.");
        return;
      }
      const uploaded = urls as string[];
      const cLabel = cityLabel(cityId);
      const postId = await createPost({
        authorName: currentUser.name,
        caption: `${title.trim()}\n\n${description.trim()}`,
        title: title.trim(),
        category,
        price: price ? Number(price) : undefined,
        cityId,
        cityLabel: geo?.area ? `${geo.area}, ${cLabel}` : cLabel,
        area: geo?.area ?? currentUser.area,
        hashtags: keywords,
        geo: geo ?? undefined,
        coverImage: uploaded[0],
        images: uploaded,
      });
      if (!postId) {
        toast.error("Could not publish post");
        return;
      }
      toast.success("🚀 Ad published!");
      navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-sm font-semibold text-muted-foreground">
        {authChecked ? "Opening your account…" : "Checking your account…"}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-32">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/95 px-3 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/" })}
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Create Ad</h1>
        <div className="w-10" />
      </header>

      <div className="mx-auto max-w-xl space-y-5 px-4 pt-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture={source === "camera" ? "environment" : undefined}
          className="hidden"
          onChange={onFiles}
        />

        {/* Photos */}
        {images.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="tap flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/60 bg-primary/5 px-6 py-10"
          >
            <div className="text-4xl">📸</div>
            <div className="text-base font-bold">Tap to Add Photos</div>
            <div className="text-xs text-muted-foreground">
              Up to {MAX_IMAGES} images · Auto-compressed
            </div>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img src={src.previewUrl} alt={`p-${i}`} className="h-full w-full object-cover" />
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
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/60 bg-primary/5 text-primary"
                  aria-label="Add more"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">Add</span>
                </button>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {images.length}/{MAX_IMAGES} · first photo is the cover
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-bold">Category</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 w-full appearance-none rounded-2xl bg-secondary px-4 pr-10 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-bold">Title</label>
          <div className="flex h-12 items-center gap-2 rounded-2xl bg-secondary px-4">
            <span className="text-base">✏️</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2BHK House for Rent"
              maxLength={120}
              className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-bold">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your listing..."
            rows={5}
            maxLength={1500}
            className="w-full resize-none rounded-2xl bg-secondary p-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Price + City row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-bold">Price / Salary</label>
            <div className="flex h-12 items-center gap-2 rounded-2xl bg-secondary px-4">
              <span className="text-base font-semibold">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="8000"
                className="w-full bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">City</label>
            <div className="relative flex h-12 items-center gap-2 rounded-2xl bg-secondary px-4">
              <span className="text-base">📍</span>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full appearance-none bg-transparent text-base font-medium focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Auto-SEO Keywords */}
        <div>
          <label className="mb-1.5 block text-sm font-bold">Auto-SEO Keywords</label>
          <div className="min-h-12 rounded-2xl bg-secondary px-4 py-3">
            {keywords.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Auto-generated from your post
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div>
          {!showMap && !geo ? (
            <button
              onClick={() => setShowMap(true)}
              className="tap flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-left"
            >
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <div className="text-sm font-bold">Pin Location on Map</div>
                <div className="text-xs text-muted-foreground">
                  Tap to auto-detect with GPS
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="h-4 w-4 text-primary" /> Pin Location on Map
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
              <MapPicker
                initial={geo}
                onChange={(g) => {
                  setGeo(g);
                  setShowMap(true);
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={upload}
          disabled={submitting}
          className="tap mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {submitting ? "Publishing…" : "🚀 Publish Ad Now"}
        </button>
      </div>
    </div>
  );
}
