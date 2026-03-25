"use client";

import { useEffect } from "react";

export const IosViewportListener = () => {
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIos) return;
    if (!window.visualViewport) return;

    // Snapshot full height before any keyboard opens.
    // With interactiveWidget:"resizes-content" window.innerHeight shrinks when
    // the keyboard is visible, so we can't rely on it later for detection.
    const fullHeight = window.innerHeight;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const correctScroll = (el: HTMLElement) => {
      if (!window.visualViewport) return;
      const vvHeight = window.visualViewport.height;
      if (vvHeight >= fullHeight * 0.75) return; // keyboard not visible

      const rect = el.getBoundingClientRect();
      // Already in a good zone — at least 25 % from top, above keyboard
      if (rect.top >= vvHeight * 0.25 && rect.bottom <= vvHeight - 20) return;

      const scrollContainer = document.querySelector(
        "[data-scroll-container]"
      ) as HTMLElement | null;
      if (!scrollContainer) {
        el.scrollIntoView({ block: "nearest", behavior: "instant" });
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const elementTopInContainer =
        rect.top - containerRect.top + scrollContainer.scrollTop;
      // Place element at ~35 % from the top of the visual viewport
      const targetScrollTop = elementTopInContainer - vvHeight * 0.35;
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "instant",
      });
    };

    // PRIMARY: fires as the keyboard animates in/out.
    // Debounce 150 ms so we run after the animation AND after any React
    // re-renders triggered by other resize listeners (e.g. DatePicker).
    const handleViewportResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement;
        if (
          !activeEl ||
          (activeEl.tagName !== "INPUT" && activeEl.tagName !== "TEXTAREA")
        )
          return;
        correctScroll(activeEl);
      }, 150);
    };

    // SECONDARY: keyboard already open, user taps a different input —
    // no resize event fires in that case, so focusin handles it.
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      setTimeout(() => {
        if (document.activeElement !== target) return;
        if (!window.visualViewport) return;
        const vvHeight = window.visualViewport.height;
        if (vvHeight >= fullHeight * 0.75) return; // keyboard not open yet
        correctScroll(target);
      }, 100);
    };

    const handleFocusOut = () => {
      setTimeout(() => window.scrollTo(0, 0), 50);
    };

    window.visualViewport.addEventListener("resize", handleViewportResize);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.visualViewport!.removeEventListener("resize", handleViewportResize);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      clearTimeout(debounceTimer);
    };
  }, []);

  return null;
};
