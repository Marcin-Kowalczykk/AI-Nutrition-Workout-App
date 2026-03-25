"use client";

import { useEffect } from "react";

const scrollInputIntoView = (el: HTMLElement) => {
  const vv = window.visualViewport;
  const viewportHeight = vv?.height ?? window.innerHeight;

  const container = document.querySelector<HTMLElement>("[data-scroll-container]");

  if (!container) {
    el.scrollIntoView({ block: "center" });
    return;
  }

  const elRect = el.getBoundingClientRect();

  const offsetTop = vv?.offsetTop ?? 0;
  const targetScrollTop =
    elRect.top + container.scrollTop - offsetTop - viewportHeight / 2 + el.offsetHeight / 2;

  container.scrollTo({
    top: Math.max(0, Math.min(targetScrollTop, container.scrollHeight - container.clientHeight)),
    behavior: "smooth",
  });
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
