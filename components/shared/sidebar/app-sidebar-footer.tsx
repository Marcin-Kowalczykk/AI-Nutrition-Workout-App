"use client";

import { useEffect, useState, useRef } from "react";

// hooks
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const AppSidebarFooter = () => {
  const { isMobile, state } = useSidebar();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (state === "collapsed") {
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 0);
      return;
    }

    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state]);

  if (state === "collapsed") {
    return null;
  }

  return (
    <SidebarFooter
      className={cn(
        "border-t px-6 py-2 flex flex-col gap-2 overflow-hidden group-data-[collapsible=icon]:hidden",
        "transition-opacity duration-200 ease-linear",
        isVisible ? "opacity-100" : "opacity-0",
        isMobile ? "text-xs" : "text-sm"
      )}
    >
      <div className="flex flex-wrap gap-2 text-muted-foreground">
        Created by Marcin Kowalczyk
      </div>
    </SidebarFooter>
  );
};
