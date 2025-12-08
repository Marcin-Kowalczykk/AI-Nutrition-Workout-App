"use client";
// hooks
import { usePathname } from "next/navigation";
import Link from "next/link";

// components
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// types
import { type LucideIcon } from "lucide-react";

export type NavSettingsType = {
  title: string;
  url: string;
  icon?: LucideIcon;
  iconComponent?: React.ReactNode;
  onClick?: () => void;
};

export const CustomMenuItem = ({
  title,
  url,
  icon,
  iconComponent,
  onClick,
}: NavSettingsType) => {
  const appRoute = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const IconComponent = icon;
  const isActive = appRoute === url;

  const handleClick = () => {
    // Execute custom onClick handler if provided
    if (onClick) {
      onClick();
    }
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem key={title}>
      <SidebarMenuButton
        className={`${
          isActive
            ? "bg-muted text-secondary-foreground gap-4"
            : "bg-transparent gap-4"
        } group-data-[collapsible=icon]:justify-center`}
        asChild
        tooltip={title}
      >
        <Link href={url} onClick={handleClick}>
          {iconComponent && iconComponent}
          {IconComponent && <IconComponent />}
          <span className="group-data-[collapsible=icon]:hidden">{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
