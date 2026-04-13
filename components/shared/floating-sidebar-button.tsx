"use client";

import { Menu } from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// hooks
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingSidebarButtonProps {
  className?: string;
}

export const FloatingSidebarButton = ({
  className,
}: FloatingSidebarButtonProps) => {
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      aria-label="Otwórz menu"
      onClick={() => setOpenMobile(true)}
      className={cn(
        "fixed bottom-26 right-4 z-40 h-10 w-10 rounded-full border bg-background/80 shadow-lg backdrop-blur",
        className
      )}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};
