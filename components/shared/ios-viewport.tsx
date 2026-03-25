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
        const vv = window.visualViewport;
        if (!vv) return;
        let done = false;
        const cleanup = () => {
          vv.removeEventListener("resize", onResize);
          clearTimeout(fallbackTimer);
        };
        const onResize = () => {
          if (!isKeyboardVisible() || done) return;
          done = true;
          cleanup();
          setTimeout(() => {
            if (document.activeElement !== target) return;
            const vpHeight = vv.height;
            const offsetTop = vv.offsetTop;
            const elRect = target.getBoundingClientRect();
            const elVisualBottom = elRect.top - offsetTop + target.offsetHeight;
            const GAP = 16;
            const targetBottom = vpHeight - GAP;
            if (Math.abs(elVisualBottom - targetBottom) < 20) return;
            const container = document.querySelector<HTMLElement>("[data-scroll-container]");
            if (!container) return;
            const targetScrollTop = container.scrollTop + (elVisualBottom - targetBottom);
            container.scrollTop = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - container.clientHeight));
          }, 100);
        };
        vv.addEventListener("resize", onResize);
        const fallbackTimer = setTimeout(cleanup, 1500);
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
