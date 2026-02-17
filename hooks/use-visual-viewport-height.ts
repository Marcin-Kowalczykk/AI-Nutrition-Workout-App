"use client";

import { useState, useEffect } from "react";

export function useVisualViewportHeight(enabled: boolean): number | undefined {
  const [height, setHeight] = useState<number | undefined>(() =>
    typeof window !== "undefined" && enabled
      ? window.visualViewport?.height ?? window.innerHeight
      : undefined
  );

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!enabled || !vv) {
      return;
    }

    const updateHeight = () => {
      setHeight(vv.height);
    };

    updateHeight();
    vv.addEventListener("resize", updateHeight);
    vv.addEventListener("scroll", updateHeight);

    return () => {
      vv.removeEventListener("resize", updateHeight);
      vv.removeEventListener("scroll", updateHeight);
    };
  }, [enabled]);

  return height;
}
