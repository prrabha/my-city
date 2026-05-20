import type { SVGProps } from "react";

export function GoogleMapsPinIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.75" />
    </svg>
  );
}

export function googleMapsUrlForPost(post: {
  geo?: { lat: number; lng: number; area?: string; city?: string; state?: string } | null;
  cityLabel?: string;
}): string {
  if (post.geo) {
    return `https://www.google.com/maps/search/?api=1&query=${post.geo.lat},${post.geo.lng}`;
  }
  const parts = [post.cityLabel].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts || "")}`;
}
