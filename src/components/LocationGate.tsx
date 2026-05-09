import { useEffect } from "react";
import { CITIES, getUser, setUser } from "@/lib/store";
import { toast } from "sonner";

const KEY_PROMPTED = "loka:locPrompted";

// Best-effort reverse lookup: pick the closest seeded city by lat/lng.
// Uses a tiny embedded centroid table — purely client-side, no network.
const CENTROIDS: Record<string, { lat: number; lng: number }> = {
  khammam: { lat: 17.247, lng: 80.149 },
  vijayawada: { lat: 16.506, lng: 80.648 },
  hyderabad: { lat: 17.385, lng: 78.486 },
  warangal: { lat: 17.967, lng: 79.594 },
  vizag: { lat: 17.686, lng: 83.218 },
  bangalore: { lat: 12.971, lng: 77.594 },
};

function nearestCityId(lat: number, lng: number): string | null {
  let best: { id: string; d: number } | null = null;
  for (const id of Object.keys(CENTROIDS)) {
    const c = CENTROIDS[id];
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (!best || d < best.d) best = { id, d };
  }
  return best?.id ?? null;
}

export function LocationGate() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const user = getUser();
    if (!user) return; // wait until signed in
    if (user.locationGranted) return;
    if (sessionStorage.getItem(KEY_PROMPTED)) return;
    if (!("geolocation" in navigator)) return;

    sessionStorage.setItem(KEY_PROMPTED, "1");

    const t = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const cityId = nearestCityId(pos.coords.latitude, pos.coords.longitude);
          const city = CITIES.find((c) => c.id === (cityId ?? user.cityId));
          setUser({
            ...user,
            cityId: city?.id ?? user.cityId,
            area: city?.name,
            locationGranted: true,
          });
          toast.success(`Showing posts near ${city?.name ?? "you"}`);
        },
        () => {
          // Denied: keep manual city, do not break the app
          setUser({ ...user, locationGranted: false });
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 30 },
      );
    }, 1500);

    return () => clearTimeout(t);
  }, []);

  return null;
}
