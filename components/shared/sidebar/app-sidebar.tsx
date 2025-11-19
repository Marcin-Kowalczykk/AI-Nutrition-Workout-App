"use client";
import * as React from "react";

// components
import { X, Menu } from "lucide-react";
import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebarFooter } from "./app-sidebar-footer";
import { Button } from "@/components/ui/button";

// hooks
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  const handleToggle = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      toggleSidebar();
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="h-8 w-8"
        >
          {isMobile ? (
            <>
              <X className="h-4 w-4" />
              <span className="sr-only">Close Sidebar</span>
            </>
          ) : (
            <>
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </>
          )}
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <AppSidebarFooter />
    </Sidebar>
  );
}
