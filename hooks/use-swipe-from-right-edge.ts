"use client";

import { useEffect } from "react";

const EDGE_ZONE_PX = 30;
const MIN_SWIPE_DISTANCE_PX = 60;

export const useSwipeFromRightEdge = (onSwipe: () => void) => {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX >= window.innerWidth - EDGE_ZONE_PX) {
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const touch = e.touches[0];
      const deltaX = startX - touch.clientX;
      const deltaY = Math.abs(touch.clientY - startY);

      // Cancel if mostly vertical
      if (deltaY > deltaX) {
        tracking = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = e.changedTouches[0];
      const deltaX = startX - touch.clientX;

      if (deltaX >= MIN_SWIPE_DISTANCE_PX) {
        onSwipe();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipe]);
};
