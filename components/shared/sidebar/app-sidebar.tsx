"use client";
import * as React from "react";

import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { AppSidebarFooter } from "./app-sidebar-footer";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <h1 className="text-xl font-bold text-center">
          Training Diet App logo
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <AppSidebarFooter />
    </Sidebar>
  );
}
