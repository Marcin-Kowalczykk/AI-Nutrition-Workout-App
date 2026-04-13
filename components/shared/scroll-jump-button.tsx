"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScrollDirection = "up" | "down";

interface ScrollJumpButtonProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export const ScrollJumpButton = ({
  scrollContainerRef,
  className,
}: ScrollJumpButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<ScrollDirection>("down");
  const lastScrollTopRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setIsVisible(false), 2000);
  }, []);

  useEffect(() => {
    setIsVisible(false);
    lastScrollTopRef.current = 0;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, [pathname]);

  useEffect(() => {
    const container =
      scrollContainerRef?.current ??
      (document.scrollingElement as HTMLElement | null) ??
      document.documentElement;

    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScrollTop = scrollHeight - clientHeight;
      const hasVerticalScroll = scrollHeight > clientHeight + 8;

      if (!hasVerticalScroll) {
        setIsVisible(false);
        return;
      }

      const atTop = scrollTop <= 4;
      const atBottom = maxScrollTop - scrollTop <= 4;

      // Na samym dole zawsze przewijaj do góry, na samej górze – w dół
      if (atBottom) {
        setDirection("up");
      } else if (atTop) {
        setDirection("down");
      } else {
        const previousTop = lastScrollTopRef.current;
        const delta = scrollTop - previousTop;

        if (Math.abs(delta) > 4) {
          setDirection(delta > 0 ? "down" : "up");
          lastScrollTopRef.current = scrollTop;
        }
      }

      // Show the button whenever vertical scroll exists
      // and the user is not at both extremes at once (tiny content).
      const visible = !(atTop && atBottom);
      setIsVisible(visible);
      if (visible) scheduleHide();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    const handleResize = () => handleScroll();
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scrollContainerRef, scheduleHide]);

  const handleClick = () => {
    const container =
      scrollContainerRef?.current ??
      (document.scrollingElement as HTMLElement | null) ??
      document.documentElement;

    if (!container) return;

    const { scrollHeight, clientHeight } = container;

    const targetTop = direction === "down" ? scrollHeight - clientHeight : 0;

    container.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      aria-label={
        direction === "down"
          ? "Przewiń na dół strony"
          : "Przewiń na górę strony"
      }
      onClick={handleClick}
      className={cn(
        "fixed bottom-14 right-4 z-40 h-10 w-10 rounded-full border bg-background/80 shadow-lg backdrop-blur",
        "md:bottom-4 md:right-6",
        className
      )}
    >
      {direction === "down" ? (
        <ArrowDown className="h-5 w-5" />
      ) : (
        <ArrowUp className="h-5 w-5" />
      )}
    </Button>
  );
};
