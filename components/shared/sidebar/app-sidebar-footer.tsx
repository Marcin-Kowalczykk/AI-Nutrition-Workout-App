"use client";

// hooks
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";

export const AppSidebarFooter = () => {
  const { isMobile } = useSidebar();

  return (
    <SidebarFooter
      className={`border-t px-6 py-2 flex flex-col gap-2 overflow-hidden group-data-[collapsible=icon]:hidden ${
        isMobile ? "text-xs" : "text-sm"
      }`}
    >
      <div className="flex flex-wrap gap-2">
        <a className="font-medium text-muted-foreground" href="#">
          Created by Marcin Kowalczyk
        </a>
      </div>
    </SidebarFooter>
  );
};
