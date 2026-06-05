import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bell, MapPin, Camera, Image as ImageIcon, Check, X, AlertTriangle, ArrowRight } from "lucide-react";
import {
  usePermStatus,
  requestNotifications,
  requestLocation,
  requestCamera,
  markGalleryGranted,
  markGalleryDenied,
  type PermissionKey,
  type PermissionState,
} from "@/lib/permissions";
import { toast } from "sonner";

export const Route = createFileRoute("/permissions")({
  head: () => ({ meta: [{ title: "Allow access — Loka" }] }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const navigate = useNavigate();
  const status = usePermStatus();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<PermissionKey | null>(null);

  const wrap = async (key: PermissionKey, fn: () => Promise<PermissionState>) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res === "granted") toast.success(`${LABEL[key]} enabled`);
    else if (res === "blocked")
      toast.error(`${LABEL[key]} is blocked. Enable it in your browser/device settings.`);
    else if (res === "unsupported") toast.message(`${LABEL[key]} isn't supported on this device.`);
  };

  const openGallery = () => fileRef.current?.click();

  const allDone = (["notifications", "location", "camera", "gallery"] as PermissionKey[]).every(
    (k) => status[k] !== "unknown",
  );

  return (
    <div className="min-h-dvh bg-gradient-warm pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Allow Loka to use your device</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We use these to show nearby posts, let you call sellers, and let you upload photos. You
            can change any of this later in Settings.
          </p>
        </div>

        <div className="space-y-3">
          <PermCard
            icon={<Bell className="h-5 w-5" />}
            tint="bg-amber-100 text-amber-600"
            title="Notifications"
            desc="Get alerts for messages and nearby posts."
            state={status.notifications}
            busy={busy === "notifications"}
            onAllow={() => wrap("notifications", requestNotifications)}
          />
          <PermCard
            icon={<MapPin className="h-5 w-5" />}
            tint="bg-sky-100 text-sky-600"
            title="Live Location"
            desc="Show what's around you and rank posts by distance."
            state={status.location}
            busy={busy === "location"}
            onAllow={() => wrap("location", requestLocation)}
          />
          <PermCard
            icon={<Camera className="h-5 w-5" />}
            tint="bg-emerald-100 text-emerald-600"
            title="Camera"
            desc="Take photos directly when posting an item."
            state={status.camera}
            busy={busy === "camera"}
            onAllow={() => wrap("camera", requestCamera)}
          />
          <PermCard
            icon={<ImageIcon className="h-5 w-5" />}
            tint="bg-purple-100 text-purple-600"
            title="Photos / Gallery"
            desc="Pick existing photos from your device."
            state={status.gallery}
            busy={busy === "gallery"}
            onAllow={openGallery}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length) {
                markGalleryGranted();
                toast.success("Photos access enabled");
              } else {
                markGalleryDenied();
              }
              e.target.value = "";
            }}
          />
        </div>

        <button
          onClick={() => navigate({ to: "/" })}
          className="tap mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow"
        >
          {allDone ? "Continue" : "Skip for now"} <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          If a prompt was blocked, you'll need to re-enable it from your browser site settings.
        </p>
      </div>
    </div>
  );
}

const LABEL: Record<PermissionKey, string> = {
  notifications: "Notifications",
  location: "Location",
  camera: "Camera",
  gallery: "Photos",
};

function PermCard({
  icon,
  tint,
  title,
  desc,
  state,
  busy,
  onAllow,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  desc: string;
  state: PermissionState;
  busy: boolean;
  onAllow: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">{title}</h3>
          <StatusBadge state={state} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        {state !== "granted" && state !== "unsupported" && (
          <button
            onClick={onAllow}
            disabled={busy}
            className="tap mt-2 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Asking…" : state === "blocked" ? "Try again" : "Allow"}
          </button>
        )}
        {state === "blocked" && (
          <p className="mt-1.5 text-[11px] text-amber-700">
            Blocked. Open your browser site settings → Permissions to re-enable, then tap Try again.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: PermissionState }) {
  if (state === "granted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
        <Check className="h-3 w-3" /> Allowed
      </span>
    );
  if (state === "blocked")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
        <X className="h-3 w-3" /> Blocked
      </span>
    );
  if (state === "denied")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <AlertTriangle className="h-3 w-3" /> Not allowed
      </span>
    );
  if (state === "unsupported")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
        N/A
      </span>
    );
  return null;
}
