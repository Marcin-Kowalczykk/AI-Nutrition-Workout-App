"use client";

import { useEffect } from "react";

export const IosViewportListener = () => {
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;

    const handleFocusOut = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
    };

    document.addEventListener("focusout", handleFocusOut);
    return () => document.removeEventListener("focusout", handleFocusOut);
  }, []);

  return null;
};
