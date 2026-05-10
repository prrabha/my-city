import { lazy, Suspense, useEffect, useState } from "react";
import type { GeoPin } from "@/lib/store";

const Inner = lazy(() => import("./MapPicker.client").then((m) => ({ default: m.MapPickerInner })));

type Props = {
  initial?: GeoPin | null;
  onChange: (pin: GeoPin) => void;
  height?: number;
};

export function MapPicker(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        style={{ height: props.height ?? 280 }}
        className="flex w-full items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground"
      >
        Loading map…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div
          style={{ height: props.height ?? 280 }}
          className="flex w-full items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground"
        >
          Loading map…
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
