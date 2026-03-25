"use client";

import { useEffect } from "react";

const scrollInputIntoView = (el: HTMLElement) => {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

  // Use the explicitly-marked scroll container rather than detecting by overflow style,
  // because overflow detection can accidentally match inner scrollable components
  const container = document.querySelector<HTMLElement>("[data-scroll-container]");

  if (!container) {
    el.scrollIntoView({ block: "center" });
    return;
  }

  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Absolute position of the element within the scrollable content.
  // getBoundingClientRect is viewport-relative; adding scrollTop converts to content-relative.
  // window.scrollY cancels out in (elRect.top - containerRect.top), so it's scroll-safe.
  const elAbsoluteTop = elRect.top - containerRect.top + container.scrollTop;

  // Scroll so the element is vertically centered in the visible viewport (above keyboard)
  const targetScrollTop = elAbsoluteTop - viewportHeight / 2 + el.offsetHeight / 2;

  container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
};

const isKeyboardVisible = () =>
  !!(window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75);

export const IosViewportListener = () => {
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      // If keyboard is already open (switching inputs) use a short delay,
      // otherwise wait for the keyboard open animation (~300ms on iOS)
      const delay = isKeyboardVisible() ? 100 : 350;
      setTimeout(() => {
        if (document.activeElement === target) scrollInputIntoView(target);
      }, delay);
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
