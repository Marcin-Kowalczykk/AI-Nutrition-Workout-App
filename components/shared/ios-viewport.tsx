"use client";

import { useEffect } from "react";

export const IosViewportListener = () => {
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      setTimeout(() => {
        if (document.activeElement !== target) return;
        if (!window.visualViewport) return;

        const vvHeight = window.visualViewport.height;
        // Keyboard not visible — nothing to do
        if (vvHeight >= window.innerHeight * 0.75) return;

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
        // Place element at ~35% from top of visual viewport (above keyboard)
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
