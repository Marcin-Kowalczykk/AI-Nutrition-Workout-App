"use client";
import * as React from "react";
import { useState } from "react";
// hooks
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// components
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ConfirmModal } from "../confirm-modal/confirm-modal";
import { useWorkoutUnsavedChanges } from "@/components/workout-form/context/workout-unsaved-context";

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
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const { hasUnsavedChanges } = useWorkoutUnsavedChanges();

  const IconComponent = icon;
  const isActive = appRoute === url;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const isWorkoutRoute = appRoute.startsWith("/workout");
    const isNavigatingAwayFromWorkout = isWorkoutRoute && url !== appRoute;

    if (isNavigatingAwayFromWorkout && hasUnsavedChanges) {
      event.preventDefault();
      setPendingUrl(url);
      setShowUnsavedModal(true);
      return;
    }

    if (onClick) {
      onClick();
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleConfirmNavigate = () => {
    if (!pendingUrl) {
      setShowUnsavedModal(false);
      return;
    }

    const targetUrl = pendingUrl;
    setPendingUrl(null);
    setShowUnsavedModal(false);

    if (onClick) {
      onClick();
    }

    router.push(targetUrl);

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleStayOnForm = () => {
    setShowUnsavedModal(false);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
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
            <span className="group-data-[collapsible=icon]:hidden">
              {title}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <ConfirmModal
        open={showUnsavedModal}
        onOpenChange={setShowUnsavedModal}
        title="Unsaved workout changes"
        description="You have unsaved changes to your workout. Do you want to go back to the form to save them, or leave without saving?"
        confirmLabel="Back to form"
        cancelLabel="Leave without saving"
        onConfirm={handleStayOnForm}
        onCancel={handleConfirmNavigate}
      />
    </>
  );
};
