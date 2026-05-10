import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { GeoPin } from "@/lib/store";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const meIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (pts.length === 1) {
      map.setView(pts[0], 15);
    } else if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    }
  }, [pts, map]);
  return null;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export type PostMapInnerProps = { pin: GeoPin; height?: number; showRoute?: boolean };

export function PostMapInner({ pin, height = 360, showRoute = true }: PostMapInnerProps) {
  const [mounted, setMounted] = useState(false);
  const [me, setMe] = useState<[number, number] | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !showRoute || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, [mounted, showRoute]);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="flex w-full items-center justify-center bg-muted text-xs text-muted-foreground"
      >
        Loading map…
      </div>
    );
  }

  const target: [number, number] = [pin.lat, pin.lng];
  const pts: [number, number][] = me ? [me, target] : [target];
  const km = me ? haversineKm(me, target) : null;

  return (
    <div className="relative w-full" style={{ height }}>
      <MapContainer center={target} zoom={15} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={target} icon={icon} />
        {me && (
          <>
            <Marker position={me} icon={meIcon} />
            <Polyline
              positions={[me, target]}
              pathOptions={{ color: "#2563eb", weight: 4, dashArray: "6 8", opacity: 0.85 }}
            />
          </>
        )}
        <FitBounds pts={pts} />
      </MapContainer>
      {km != null && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold shadow-soft">
          {km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`}
        </div>
      )}
    </div>
  );
}
