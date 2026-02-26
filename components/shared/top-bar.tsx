"use client";

import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  EnableRoutes,
  NavMainTitles,
} from "@/components/shared/sidebar/nav-main";

const getTitleForPath = (pathname: string): string | null => {
  if (pathname === EnableRoutes.WorkoutHistory) {
    return NavMainTitles.WorkoutHistory;
  }

  if (pathname === EnableRoutes.CreateNewWorkout) {
    return NavMainTitles.CreateNewWorkout;
  }

  if (pathname.startsWith("/workout/edit")) {
    return NavMainTitles.EditWorkout;
  }

  if (pathname === EnableRoutes.Templates) {
    return NavMainTitles.Templates;
  }

  if (pathname === "/workout/template/create") {
    return NavMainTitles.CreateTemplate;
  }

  if (pathname.startsWith("/workout/template/") && pathname.endsWith("/edit")) {
    return NavMainTitles.EditTemplate;
  }

  if (pathname === EnableRoutes.Exercises) {
    return NavMainTitles.Exercises;
  }

  if (pathname === EnableRoutes.DietHistory) {
    return NavMainTitles.DietHistory;
  }

  if (pathname === EnableRoutes.KcalCalculator) {
    return NavMainTitles.KcalCalculator;
  }

  if (pathname === EnableRoutes.BodyMeasurements) {
    return NavMainTitles.BodyMeasurements;
  }

  if (pathname === EnableRoutes.ProfileSettings) {
    return NavMainTitles.ProfileSettings;
  }

  return null;
};

export const TopBar = () => {
  const pathname = usePathname();
  const title = pathname ? getTitleForPath(pathname) : null;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between gap-2 px-4 w-full">
        <div className="-ml-1 flex cursor-pointer items-center gap-2 text-sidebar-foregroud">
          <SidebarTrigger />
        </div>
        {title && (
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold tracking-normal text-muted-foreground">
              {title}
            </span>
          </div>
        )}
        <div className="w-6" />
      </div>
    </header>
  );
};
