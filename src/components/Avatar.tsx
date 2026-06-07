import { colorFromString } from "@/lib/avatar";

type Props = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export function Avatar({ src, name, size = 40, className = "" }: Props) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(12, Math.round(size * 0.42)),
  };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`inline-block rounded-full object-cover bg-muted ${className}`}
        loading="lazy"
        onError={(e) => {
          // Hide broken image so fallback initial shows via parent restyling if any
          (e.currentTarget as HTMLImageElement).style.display = "none";
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
