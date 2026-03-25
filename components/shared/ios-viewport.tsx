"use client";

import { useEffect } from "react";

const isKeyboardVisible = () =>
  !!(window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75);

export const IosViewportListener = () => {
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

      if (!isKeyboardVisible()) {
        setTimeout(() => {
          if (document.activeElement !== target) return;
          const vv = window.visualViewport;
          const vpHeight = vv?.height ?? window.innerHeight;
          const offsetTop = vv?.offsetTop ?? 0;
          const elRect = target.getBoundingClientRect();
          const elVisualBottom = elRect.top - offsetTop + target.offsetHeight;
          const GAP = 16;
          if (elVisualBottom <= vpHeight - GAP) return;
          const container = document.querySelector<HTMLElement>("[data-scroll-container]");
          if (!container) return;
          const targetScrollTop = elRect.top + target.offsetHeight + container.scrollTop - offsetTop - (vpHeight - GAP);
          container.scrollTop = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - container.clientHeight));
        }, 350);
        return;
      }

      setTimeout(() => {
        if (document.activeElement === target) {
          target.scrollIntoView({ block: "center", behavior: "instant" });
        }
      }, 100);
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
