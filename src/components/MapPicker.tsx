import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import type { GeoPin } from "@/lib/store";
import type { MapPickerInnerProps } from "./MapPicker.client";

const Inner = lazy(async () => {
  const m = await import("./MapPicker.client");
  return { default: m.MapPickerInner as ComponentType<MapPickerInnerProps> };
});

type Props = {
  initial?: GeoPin | null;
  onChange: (pin: GeoPin) => void;
  height?: number;
};

export function MapPicker(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fallback = (
    <div
      style={{ height: props.height ?? 280 }}
      className="flex w-full items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground"
    >
      Loading map…
    </div>
  );
  if (!mounted) return fallback;
  return (
    <Suspense fallback={fallback}>
      <Inner {...props} />
    </Suspense>
  );
}
