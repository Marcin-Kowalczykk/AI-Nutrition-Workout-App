"use client";

// icons
import { LogOut } from "lucide-react";

// components
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";

// hooks
import { useLogout } from "./api/use-logout";

const LogoutButton = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    logout();
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleLogout}
          disabled={isPending}
          className="bg-transparent hover:bg-primary-element/10 hover:text-primary-element group-data-[collapsible=icon]:justify-center"
          tooltip="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      variant="default"
      className="w-full"
      disabled={isPending}
    >
      {isPending ? <Loader /> : "Logout"}
    </Button>
  );
};

export default LogoutButton;
