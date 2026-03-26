"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { History } from "lucide-react";

// components
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ConfirmModal } from "@/components/shared/confirm-modal/confirm-modal";
import {
  EnableRoutes,
  NavMainTitles,
} from "@/components/shared/sidebar/nav-main";

// hooks
import { useWorkoutUnsavedChanges } from "@/components/workout-form/context/workout-unsaved-context";

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

  if (pathname === EnableRoutes.Records) {
    return NavMainTitles.Records;
  }

  if (pathname === EnableRoutes.Comparisons) {
    return NavMainTitles.Comparisons;
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
  const router = useRouter();
  const title = pathname ? getTitleForPath(pathname) : null;
  const { hasUnsavedChanges, discardRef } = useWorkoutUnsavedChanges();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const isEditWorkout = pathname?.startsWith("/workout/edit");

  const handleHistoryClick = (event: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      setShowUnsavedModal(true);
    } else {
      router.push(EnableRoutes.WorkoutHistory);
    }
  };

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    discardRef.current?.();
    router.push(EnableRoutes.WorkoutHistory);
  };

  const handleStay = () => {
    setShowUnsavedModal(false);
  };

  return (
    <>
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
          {isEditWorkout ? (
            <button
              onClick={handleHistoryClick}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <History className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>
      </header>

      <ConfirmModal
        open={showUnsavedModal}
        onOpenChange={setShowUnsavedModal}
        title="Unsaved workout changes"
        description="You have unsaved changes to your workout. Do you want to go back to the form to save them, or leave without saving?"
        confirmLabel="Back to form"
        cancelLabel="Leave without saving"
        onConfirm={handleStay}
        onCancel={handleConfirmLeave}
      />
    </>
  );
};
