"use client";

import { useEffect } from "react";

export const IosViewportListener = () => {
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;

    // With interactiveWidget:"resizes-content", window.innerHeight shrinks when
    // the keyboard appears (it equals visualViewport.height at that point).
    // We must snapshot the full-screen height once — before any keyboard opens —
    // to reliably detect whether the keyboard is visible later.
    const fullHeight = window.innerHeight;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      setTimeout(() => {
        if (document.activeElement !== target) return;
        if (!window.visualViewport) return;

        const vvHeight = window.visualViewport.height;
        // Keyboard not visible — nothing to do
        if (vvHeight >= fullHeight * 0.75) return;

        const rect = target.getBoundingClientRect();
        // Element already fully visible above keyboard
        if (rect.top >= 20 && rect.bottom <= vvHeight - 20) return;

        const scrollContainer = document.querySelector(
          "[data-scroll-container]"
        ) as HTMLElement | null;
        if (!scrollContainer) {
          target.scrollIntoView({ block: "nearest", behavior: "instant" });
          return;
        }

        const containerRect = scrollContainer.getBoundingClientRect();
        const elementTopInContainer =
          rect.top - containerRect.top + scrollContainer.scrollTop;
        // Place element at ~35% from top of visual viewport (centred above keyboard)
        const targetScrollTop = elementTopInContainer - vvHeight * 0.35;
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "instant",
        });
      }, 300);
    };

    const handleFocusOut = () => {
      setTimeout(() => window.scrollTo(0, 0), 50);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return null;
};
