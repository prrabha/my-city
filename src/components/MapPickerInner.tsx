import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { GeoPin } from "@/lib/store";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoPin>> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`,
    );
    const j = await r.json();
    const a = j.address ?? {};
    return {
      city: a.city || a.town || a.village || a.suburb,
      area: a.suburb || a.neighbourhood || a.village,
      state: a.state,
    };
  } catch {
    return {};
  }
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() < 13 ? 15 : map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export type MapPickerInnerProps = {
  initial?: GeoPin | null;
  onChange: (pin: GeoPin) => void;
  height?: number;
};

export function MapPickerInner({ initial, onChange, height = 280 }: MapPickerInnerProps) {
  const [pin, setPin] = useState<GeoPin | null>(initial ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin) return;
    if (!("geolocation" in navigator)) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const meta = await reverseGeocode(lat, lng);
        const next: GeoPin = { lat, lng, ...meta };
        setPin(next);
        onChange(next);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePin = async (lat: number, lng: number) => {
    const meta = await reverseGeocode(lat, lng);
    const next: GeoPin = { lat, lng, ...meta };
    setPin(next);
    onChange(next);
  };

  const center: [number, number] = pin ? [pin.lat, pin.lng] : [17.385, 78.486];

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div style={{ height }} className="relative w-full">
        <MapContainer center={center} zoom={pin ? 15 : 5} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pin && (
            <>
              <Marker
                position={[pin.lat, pin.lng]}
                icon={icon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target as L.Marker;
                    const ll = m.getLatLng();
                    updatePin(ll.lat, ll.lng);
                  },
                }}
              />
              <Recenter lat={pin.lat} lng={pin.lng} />
            </>
          )}
          <ClickHandler onPick={updatePin} />
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs font-medium">
            Detecting location…
          </div>
        )}
      </div>
      {pin && (
        <div className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {pin.area ? `${pin.area}, ` : ""}
            {pin.city ?? ""}
            {pin.state ? `, ${pin.state}` : ""}
          </span>{" "}
          · {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)} · tap or drag to adjust
        </div>
      )}
    </div>
  );
}
