"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if API call fails
      router.push("/login");
      router.refresh();
    }
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleLogout}
          className="bg-transparent hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
          tooltip="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Button onClick={handleLogout} variant="destructive" className="w-full">
      Logout
    </Button>
  );
};

export default LogoutButton;
