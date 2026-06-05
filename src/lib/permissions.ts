// Device permission helpers. Web-only — wraps Notification, Geolocation, and
// getUserMedia APIs. "Gallery" doesn't have a real permission on the web;
// we record it as granted when the user picks a file via <input type="file">.
import { useEffect, useState } from "react";

export type PermissionKey = "notifications" | "location" | "camera" | "gallery";
export type PermissionState = "unknown" | "granted" | "denied" | "blocked" | "unsupported";

type Status = Record<PermissionKey, PermissionState>;

const KEY = "loka:permissions";
const EVENT = "loka:permissions";

const DEFAULT: Status = {
  notifications: "unknown",
  location: "unknown",
  camera: "unknown",
  gallery: "unknown",
};

export function getPermStatus(): Status {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function setOne(key: PermissionKey, state: PermissionState) {
  const next = { ...getPermStatus(), [key]: state };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
  return next;
}

export function usePermStatus() {
  const [s, set] = useState<Status>(DEFAULT);
  useEffect(() => {
    set(getPermStatus());
    const fn = () => set(getPermStatus());
    window.addEventListener(EVENT, fn);
    return () => window.removeEventListener(EVENT, fn);
  }, []);
  return s;
}

// Map browser permission strings to ours. "denied" after a prompt = blocked.
function normalize(p: NotificationPermission | PermissionState | string): PermissionState {
  if (p === "granted") return "granted";
  if (p === "denied") return "blocked";
  if (p === "prompt" || p === "default") return "unknown";
  return "denied";
}

export async function requestNotifications(): Promise<PermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return setOne("notifications", "unsupported").notifications;
  }
  try {
    const current = Notification.permission;
    if (current === "granted") return setOne("notifications", "granted").notifications;
    if (current === "denied") return setOne("notifications", "blocked").notifications;
    const res = await Notification.requestPermission();
    return setOne("notifications", normalize(res)).notifications;
  } catch {
    return setOne("notifications", "denied").notifications;
  }
}

export async function requestLocation(): Promise<PermissionState> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return setOne("location", "unsupported").location;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(setOne("location", "granted").location),
      (err) => {
        // PERMISSION_DENIED === 1
        const state: PermissionState = err.code === 1 ? "blocked" : "denied";
        resolve(setOne("location", state).location);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export async function requestCamera(): Promise<PermissionState> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return setOne("camera", "unsupported").camera;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Release the camera right after the prompt — we only wanted the grant.
    stream.getTracks().forEach((t) => t.stop());
    return setOne("camera", "granted").camera;
  } catch (e) {
    const name = (e as DOMException)?.name;
    const state: PermissionState =
      name === "NotAllowedError" || name === "SecurityError" ? "blocked" : "denied";
    return setOne("camera", state).camera;
  }
}

export function markGalleryGranted() {
  setOne("gallery", "granted");
}
export function markGalleryDenied() {
  setOne("gallery", "denied");
}

// Refresh from the Permissions API where supported (covers the case where the
// user changed a site permission in browser settings after we cached "blocked").
export async function refreshPermStatus() {
  if (typeof navigator === "undefined" || !("permissions" in navigator)) return;
  const queries: Array<[PermissionKey, PermissionName]> = [
    ["notifications", "notifications" as PermissionName],
    ["location", "geolocation" as PermissionName],
    ["camera", "camera" as PermissionName],
  ];
  for (const [key, name] of queries) {
    try {
      const r = await navigator.permissions.query({ name });
      setOne(key, normalize(r.state));
    } catch {
      // Some browsers don't support all names; ignore silently.
    }
  }
}
