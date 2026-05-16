import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  alt?: string;
  className?: string;
  rounded?: boolean;
};

export function ImageCarousel({ images, alt = "", className = "", rounded = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const total = images.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (!w) return;
      const i = Math.round(el.scrollLeft / w);
      if (i !== idx) setIdx(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [idx]);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={ref}
        className={`no-scrollbar flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto bg-black ${rounded ? "rounded-3xl" : ""}`}
      >
        {images.map((src, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0 snap-center bg-black">
            <img
              src={src}
              alt={`${alt} ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {idx + 1}/{total}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
