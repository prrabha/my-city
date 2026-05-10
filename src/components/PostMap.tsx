import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import type { GeoPin } from "@/lib/store";
import type { PostMapInnerProps } from "./PostMap.client";

const Inner = lazy(async () => {
  const m = await import("./PostMap.client");
  return { default: m.PostMapInner as ComponentType<PostMapInnerProps> };
});

type Props = { pin: GeoPin; height?: number; showRoute?: boolean };

export function PostMap(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fallback = (
    <div
      style={{ height: props.height ?? 360 }}
      className="flex w-full items-center justify-center bg-muted text-xs text-muted-foreground"
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
