import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Sparkles } from "lucide-react";
import { addPost, cityLabel, useUser, type Post } from "@/lib/store";
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

function CreatePage() {
  const navigate = useNavigate();
  const user = useUser();
  const { source } = Route.useSearch();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  // Auto open file picker on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.click(), 200);
    return () => clearTimeout(t);
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const upload = () => {
    if (!user) return;
    if (!image) return toast.error("Please pick an image");
    if (caption.trim().length < 4) return toast.error("Add a short description");
    const p: Post = {
      id: `p_${Date.now()}`,
      authorName: user.name,
      authorMobile: user.mobile,
      cityId: user.cityId,
      cityLabel: cityLabel(user.cityId),
      image,
      caption: caption.trim(),
      createdAt: Date.now(),
      likes: 0,
    };
    addPost(p);
    toast.success("Posted to your local feed");
    navigate({ to: "/" });
  };

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background pb-32">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-3 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
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
          capture={source === "camera" ? "environment" : undefined}
          className="hidden"
          onChange={onFile}
        />

        {!image ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="tap flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-secondary/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              <ImagePlus className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">Pick a photo</div>
            <div className="text-xs text-muted-foreground">JPG / PNG up to 10 MB</div>
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-muted shadow-card">
            <img src={image} alt="Selected" className="aspect-square w-full object-cover" />
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-soft"
            >
              Change
            </button>
          </div>
        )}

        <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Description
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={placeholder}
            rows={5}
            maxLength={500}
            className="w-full resize-none bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="text-right text-[11px] text-muted-foreground">{caption.length}/500</div>
        </div>

        <button
          onClick={upload}
          className="tap mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow"
        >
          Upload post
        </button>
      </div>
    </div>
  );
}
