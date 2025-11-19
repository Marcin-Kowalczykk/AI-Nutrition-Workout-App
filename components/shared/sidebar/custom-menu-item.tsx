"use client";
// hooks
import { usePathname } from "next/navigation";

// components
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

// types
import { type LucideIcon } from "lucide-react";

export type NavSettingsType = {
  title: string;
  url: string;
  icon?: LucideIcon;
  iconComponent?: React.ReactNode;
};

export const CustomMenuItem = ({
  title,
  url,
  icon,
  iconComponent,
}: NavSettingsType) => {
  const appRoute = usePathname();

  const IconComponent = icon;
  const isActive = appRoute === url;

  return (
    <SidebarMenuItem key={title}>
      <SidebarMenuButton
        className={`${
          isActive ? "bg-muted text-primary gap-4" : "bg-transparent gap-4"
        } group-data-[collapsible=icon]:justify-center`}
        asChild
        tooltip={title}
      >
        <a href={url}>
          {iconComponent && iconComponent}
          {IconComponent && <IconComponent />}
          <span className="group-data-[collapsible=icon]:hidden">{title}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
