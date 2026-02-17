"use client";

import { useEffect, useState } from "react";

export function useVisualViewportHeight() {
  const [height, setHeight] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return window.visualViewport?.height ?? window.innerHeight;
  });

  useEffect(() => {
    const vv = window.visualViewport;
    const updateHeight = () => {
      setHeight(vv?.height ?? window.innerHeight);
    };

    const rafId = requestAnimationFrame(updateHeight);
    vv?.addEventListener("resize", updateHeight);
    vv?.addEventListener("scroll", updateHeight);

    return () => {
      cancelAnimationFrame(rafId);
      vv?.removeEventListener("resize", updateHeight);
      vv?.removeEventListener("scroll", updateHeight);
    };
  }, []);

  return height;
}
