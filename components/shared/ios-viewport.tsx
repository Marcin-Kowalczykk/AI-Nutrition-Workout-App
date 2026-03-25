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
      if (!isKeyboardVisible()) return;
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
