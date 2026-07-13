// Avatar / profile helpers using Supabase Storage + profiles table.
// Buckets are private — we store long-lived signed URLs on profiles.avatar_url
// so they can be displayed publicly across the feed.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  userId: string;
  username: string;
  fullName: string;
  displayName: string;
  avatarUrl: string | null;
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // ~5 years

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, display_name, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id,
    username: data.username,
    fullName: data.full_name,
    displayName: data.display_name || data.full_name || data.username,
    avatarUrl: data.avatar_url,
  };
}

export function useMyProfile(): { profile: Profile | null; refresh: () => Promise<void> } {
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const id = sess.session?.user?.id;
    if (!id) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(id);
    setProfile(p);
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("loka:profile", onUpdate);
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => {
      window.removeEventListener("loka:profile", onUpdate);
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  return { profile, refresh };
}

// Compress an image blob/file down to a JPEG within maxSide px. Keeps avatars/posts
// small enough that mobile uploads actually finish on slow networks.
async function compressToJpeg(file: Blob, maxSide: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve(file);
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : resolve(file);
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}

export async function uploadAvatar(file: File): Promise<string | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) {
    console.error("[uploadAvatar] no session");
    return null;
  }

  // Compress before upload so the request finishes even on slow mobile networks.
  // Skip the "list + remove old files" pre-step — it doubles latency and the
  // upsert below overwrites the canonical path anyway.
  let payload: Blob = file;
  try {
    payload = await compressToJpeg(file, 512, 0.85);
  } catch (e) {
    console.warn("[uploadAvatar] compress failed, using original", e);
  }

  const path = `${userId}/profile.jpg`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, payload, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
  if (upErr) {
    console.error("[uploadAvatar] upload error", upErr);
    return null;
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !signed?.signedUrl) {
    console.error("[uploadAvatar] sign error", signErr);
    return null;
  }

  // Bust CDN cache when overwriting the same path.
  const avatarUrl = `${signed.signedUrl}${signed.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", userId);
  if (updErr) {
    console.error("[uploadAvatar] profile update error", updErr);
    return null;
  }

  if (typeof window !== "undefined") window.dispatchEvent(new Event("loka:profile"));
  return signed.signedUrl;
}

export async function uploadPostImage(file: Blob, suggestedName = "image.jpg"): Promise<string | null> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) {
    console.error("[uploadPostImage] no session");
    return null;
  }

  const ext = (suggestedName.split(".").pop() || "jpg").toLowerCase();
  const safeExt = /^(jpg|jpeg|png|webp|gif|heic)$/.test(ext) ? ext : "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const contentType = (file as File).type || "image/jpeg";
  const { error: upErr } = await supabase.storage
    .from("post-images")
    .upload(path, file, { contentType, upsert: false });
  if (upErr) {
    console.error("[uploadPostImage] upload error", upErr);
    return null;
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("post-images")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr) console.error("[uploadPostImage] sign error", signErr);
  return signed?.signedUrl ?? null;
}

export function colorFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 65%, 55%)`;
}
