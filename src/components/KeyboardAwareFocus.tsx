import { useEffect } from "react";

/**
 * Global mobile keyboard handler.
 * On focus of any input/textarea/contenteditable, smoothly scrolls the
 * element into the center of the viewport so the on-screen keyboard
 * doesn't cover it. Also exposes the visual viewport height as a CSS var
 * (--kb-vh) and a keyboard inset (--kb-inset) so fixed bottom bars can
 * float above the keyboard on Android/iOS.
 */
export function KeyboardAwareFocus() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTypingTarget = (el: EventTarget | null): el is HTMLElement => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "TEXTAREA") return true;
      if (tag === "INPUT") {
        const type = (el as HTMLInputElement).type.toLowerCase();
        return ![
          "button",
          "submit",
          "reset",
          "checkbox",
          "radio",
          "range",
          "color",
          "file",
          "hidden",
          "image",
        ].includes(type);
      }
      if (el.isContentEditable) return true;
      return false;
    };

    let scrollTimer: number | undefined;
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!isTypingTarget(el)) return;
      window.clearTimeout(scrollTimer);
      // Wait for keyboard to start animating in, then center the field.
      scrollTimer = window.setTimeout(() => {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          el.scrollIntoView();
        }
      }, 280);
    };

    document.addEventListener("focusin", onFocusIn);

    // Visual viewport tracking for keyboard inset
    const vv = window.visualViewport;
    const updateVV = () => {
      if (!vv) return;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb-inset", `${inset}px`);
      document.documentElement.style.setProperty("--kb-vh", `${vv.height}px`);
    };
    updateVV();
    vv?.addEventListener("resize", updateVV);
    vv?.addEventListener("scroll", updateVV);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      vv?.removeEventListener("resize", updateVV);
      vv?.removeEventListener("scroll", updateVV);
      window.clearTimeout(scrollTimer);
    };
  }, []);

  return null;
}
