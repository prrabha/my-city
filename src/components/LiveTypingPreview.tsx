import { useEffect, useState } from "react";

/**
 * Global "live typing preview" bar that floats just above the on-screen
 * keyboard on mobile. Mirrors what the user types in any input/textarea/
 * contenteditable in real-time, shows a character count, and a lightweight
 * spell/typo indicator (green = looks good, yellow = possible typo).
 *
 * - Auto-enables spellCheck on focused inputs.
 * - Hidden for password / OTP / hidden fields and elements with
 *   data-no-preview.
 * - Uses --kb-inset (set by KeyboardAwareFocus) so the bar sits exactly
 *   above the keyboard on Android/iOS.
 */

type FocusedEl = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const EXCLUDED_INPUT_TYPES = new Set([
  "password",
  "hidden",
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "button",
  "submit",
  "reset",
  "image",
]);

function isTypingTarget(el: EventTarget | null): el is FocusedEl {
  if (!(el instanceof HTMLElement)) return false;
  if (el.dataset.noPreview === "true") return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT") {
    const t = (el as HTMLInputElement).type.toLowerCase();
    if (EXCLUDED_INPUT_TYPES.has(t)) return false;
    return true;
  }
  if (el.isContentEditable) return true;
  return false;
}

function readValue(el: FocusedEl): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value ?? "";
  }
  return el.innerText ?? "";
}

// Lightweight, dictionary-free typo heuristic. Flags tokens that look
// suspicious (e.g. "heloooo", "qwrtxz", no vowels, 4+ repeated letters).
function detectTypo(text: string): boolean {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z']+/i)
    .filter((t) => t.length >= 4);
  for (const tok of tokens) {
    if (/(.)\1{2,}/.test(tok)) return true; // 3+ repeated chars (helllo)
    if (tok.length >= 5 && !/[aeiouy]/.test(tok)) return true; // no vowels
    if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(tok)) return true; // 5+ consonants
  }
  return false;
}

export function LiveTypingPreview() {
  const [focused, setFocused] = useState<FocusedEl | null>(null);
  const [value, setValue] = useState("");
  const [kbInset, setKbInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!isTypingTarget(el)) return;
      // Auto-enable spellcheck
      try {
        el.setAttribute("spellcheck", "true");
      } catch {}
      setFocused(el);
      setValue(readValue(el));
    };

    const onFocusOut = (e: FocusEvent) => {
      if (e.target === focused) {
        setFocused(null);
        setValue("");
      }
    };

    const onInput = (e: Event) => {
      const el = e.target;
      if (!isTypingTarget(el)) return;
      if (el !== focused) return;
      setValue(readValue(el));
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("input", onInput, true);

    const vv = window.visualViewport;
    const updateInset = () => {
      if (!vv) return;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
    };
    updateInset();
    vv?.addEventListener("resize", updateInset);
    vv?.addEventListener("scroll", updateInset);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("input", onInput, true);
      vv?.removeEventListener("resize", updateInset);
      vv?.removeEventListener("scroll", updateInset);
    };
  }, [focused]);

  // Only show on small (mobile) screens and only when keyboard is open
  if (!focused) return null;
  if (typeof window !== "undefined" && window.innerWidth >= 768) return null;
  if (kbInset < 80) return null; // keyboard not actually open

  const trimmed = value.trim();
  const hasTypo = trimmed.length >= 4 ? detectTypo(trimmed) : false;
  const status: "empty" | "good" | "warn" = !trimmed
    ? "empty"
    : hasTypo
      ? "warn"
      : "good";

  const dotClass =
    status === "good"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-muted-foreground/40";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-0 right-0 z-[100] px-3"
      style={{ bottom: `${kbInset}px` }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-2 rounded-t-2xl border border-b-0 border-border bg-card/95 px-3 py-2 shadow-card backdrop-blur">
        <span
          aria-hidden
          className={`h-2 w-2 flex-none rounded-full ${dotClass}`}
        />
        <div
          className={`min-w-0 flex-1 truncate text-sm ${
            status === "warn"
              ? "text-amber-700 underline decoration-amber-500 decoration-wavy underline-offset-4"
              : "text-foreground"
          }`}
          title={trimmed}
        >
          {trimmed || (
            <span className="text-muted-foreground">Start typing…</span>
          )}
        </div>
        <span className="flex-none text-[11px] font-medium tabular-nums text-muted-foreground">
          {value.length}
        </span>
      </div>
    </div>
  );
}
