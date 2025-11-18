"use client";
// hooks
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";

export const AppSidebarFooter = () => {
  const { isMobile, open } = useSidebar();

  const hiddenStyle =
    "border-none px-0 h-0 py-0 flex flex-col gap-0 overflow-hidden text-sm";
  const shownStyle =
    "border-t px-6 py-2 flex flex-col gap-2 overflow-hidden text-sm";

  return (
    <SidebarFooter className={!isMobile && !open ? hiddenStyle : shownStyle}>
      <div className="flex flex-wrap gap-2">
        <a className="font-medium text-muted-foreground" href="#">
          Contact
        </a>
      </div>
    </SidebarFooter>
  );
};
