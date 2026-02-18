"use client";

import { useEffect } from "react";

/**
 * Synchronizuje wysokość Visual Viewport z CSS variable --vvh.
 * Naprawia ucięty ekran po zamknięciu klawiatury na iOS Safari (i innych mobile).
 */
export function VisualViewportHeight() {
  useEffect(() => {
    const setVvh = () => {
      const height =
        typeof window !== "undefined" && window.visualViewport
          ? window.visualViewport.height
          : typeof window !== "undefined"
            ? window.innerHeight
            : 0;
      document.documentElement.style.setProperty(
        "--vvh",
        `${Math.round(height)}px`
      );
    };

    setVvh();

    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (vv) {
      vv.addEventListener("resize", setVvh);
      vv.addEventListener("scroll", setVvh);
    }
    window.addEventListener("resize", setVvh);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", setVvh);
        vv.removeEventListener("scroll", setVvh);
      }
      window.removeEventListener("resize", setVvh);
    };
  }, []);

  return null;
}
