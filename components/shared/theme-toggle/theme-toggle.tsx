"use client";

// utils
import * as React from "react";
import { Moon, Sun } from "lucide-react";

// components
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

// hooks
import { useSidebar } from "@/components/ui/sidebar";
import { useUpdateProfile } from "@/components/profile-settings/api/use-update-profile";
import { useTheme } from "next-themes";

export enum Theme {
  Dark = "dark",
  Light = "light",
}

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  const isCollapsed = state === "collapsed";
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    const newTheme = theme === Theme.Dark ? Theme.Light : Theme.Dark;

    setTheme(newTheme);

    updateProfile({
      theme: newTheme,
    });
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={toggleTheme}
          disabled={isPending}
          className="bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
          tooltip={
            theme === Theme.Dark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {theme === Theme.Dark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="group-data-[collapsible=icon]:hidden">
            {theme === Theme.Dark ? "Light Mode" : "Dark Mode"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleTheme}
        disabled={isPending}
        className="bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        {theme === Theme.Dark ? (
          <>
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
