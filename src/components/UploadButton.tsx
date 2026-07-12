import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Camera, Image as ImageIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

interface UploadButtonProps {
  className?: string;
  variant?: "circle" | "default";
}

export function UploadButton({ className = "", variant = "circle" }: UploadButtonProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Create post"
            className={`tap flex items-center justify-center rounded-full bg-white text-foreground shadow-soft ${
              variant === "circle" ? "h-10 w-10" : "h-11 w-11"
            } ${className}`}
          >
            <Plus className={variant === "circle" ? "h-5 w-5" : "h-5 w-5"} strokeWidth={2.5} />
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
    </>
  );
}
