"use client";

import { useEffect } from "react";

export const IosViewportListener = () => {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;

    let prevHeight = vv.height;

    const handleResize = () => {
      const currentHeight = vv.height;
      if (currentHeight > prevHeight) {
        // Keyboard dismissed — nudge scroll by 1px to force compositor repaint
        // without visibly moving the page (avoids the iOS black screen bug)
        window.scrollTo(window.scrollX, window.scrollY + 1);
        window.scrollTo(window.scrollX, window.scrollY - 1);
      }
      prevHeight = currentHeight;
    };

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  return null;
};
