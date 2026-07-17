import { useEffect, useState } from "react";
import { colorFromString, refreshSignedUrl } from "@/lib/avatar";

type Props = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export function Avatar({ src, name, size = 40, className = "" }: Props) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const [currentSrc, setCurrentSrc] = useState<string | null>(src ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src ?? null);
    setFailed(false);
  }, [src]);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(12, Math.round(size * 0.42)),
  };

  if (currentSrc && !failed) {
    return (
      <img
        src={currentSrc}
        alt={name}
        style={style}
        className={`inline-block rounded-full object-cover bg-muted ${className}`}
        loading="lazy"
        onError={async () => {
          // Attempt to re-sign a stale Supabase storage URL once; fall back to initial.
          const fresh = await refreshSignedUrl(currentSrc);
          if (fresh && fresh !== currentSrc) setCurrentSrc(fresh);
          else setFailed(true);
        }}
      />
    );
  }

  const bg = colorFromString(name || "?");
  return (
    <div
      style={{ ...style, background: bg }}
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${className}`}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
