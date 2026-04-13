"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, LogOut } from "lucide-react";
import {
  HomeIcon,
  NotebookPenIcon,
  UserRoundCogIcon,
  FilesIcon,
  CalculatorIcon,
  ActivityIcon,
  FileStackIcon,
  DumbbellIcon,
  TrophyIcon,
  BarChartIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

// components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal/confirm-modal";
import { Loader } from "@/components/shared/loader";

// hooks
import { useWorkoutUnsavedChanges } from "@/components/workout-form/context/workout-unsaved-context";
import { useLogout } from "@/components/auth/logout-button/api/use-logout";
import { useUpdateProfile } from "@/components/profile-settings/api/use-update-profile";
import { clearAllFormCache } from "@/lib/form-cache";
import { toast } from "sonner";

// types
import type { LucideIcon } from "lucide-react";
import { EnableRoutes } from "@/components/shared/sidebar/nav-main";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  onClick?: () => void;
};

const topNavItems: NavItem[] = [
  { title: "Workout history", url: EnableRoutes.WorkoutHistory, icon: HomeIcon },
  { title: "Create new workout", url: EnableRoutes.CreateNewWorkout, icon: NotebookPenIcon, onClick: () => clearAllFormCache() },
  { title: "Templates", url: EnableRoutes.Templates, icon: FileStackIcon },
  { title: "Exercises", url: EnableRoutes.Exercises, icon: DumbbellIcon },
  { title: "Records", url: EnableRoutes.Records, icon: TrophyIcon },
  { title: "Comparisons", url: EnableRoutes.Comparisons, icon: BarChartIcon },
  { title: "Diet history", url: EnableRoutes.DietHistory, icon: FilesIcon },
  { title: "AI Meal Analyzer", url: EnableRoutes.AiMealAnalyzer, icon: CalculatorIcon },
  { title: "Body measurements", url: EnableRoutes.BodyMeasurements, icon: ActivityIcon },
];

const bottomNavItems: NavItem[] = [
  { title: "Profile settings", url: EnableRoutes.ProfileSettings, icon: UserRoundCogIcon },
];

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const RightDrawer = ({ open, onClose }: RightDrawerProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { hasUnsavedChanges, discardRef } = useWorkoutUnsavedChanges();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: updateProfile } = useUpdateProfile({
    onSuccess: (message) => toast.success(message),
    onError: (error) => toast.error(error),
  });

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem
  ) => {
    const isWorkoutRoute = pathname.startsWith("/workout");
    const isNavigatingAway = isWorkoutRoute && item.url !== pathname;

    if (isNavigatingAway && hasUnsavedChanges) {
      e.preventDefault();
      setPendingUrl(item.url);
      setShowUnsavedModal(true);
      return;
    }

    item.onClick?.();
    onClose();
  };

  const handleConfirmNavigate = () => {
    if (!pendingUrl) {
      setShowUnsavedModal(false);
      return;
    }
    const targetUrl = pendingUrl;
    setPendingUrl(null);
    setShowUnsavedModal(false);
    discardRef.current?.();
    router.push(targetUrl);
    onClose();
  };

  const handleStayOnForm = () => {
    setShowUnsavedModal(false);
    onClose();
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    updateProfile({ theme: newTheme });
  };

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.url;
      return (
        <Link
          key={item.url}
          href={item.url}
          onClick={(e) => handleNavClick(e, item)}
          className={`flex items-center gap-4 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive
              ? "bg-muted text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.title}</span>
        </Link>
      );
    });

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-72 flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm font-semibold text-muted-foreground">
              Menu
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col justify-between gap-4 overflow-y-auto p-4">
            <nav className="flex flex-col gap-1">
              {renderNavItems(topNavItems)}
            </nav>

            <div className="flex flex-col gap-2">
              {renderNavItems(bottomNavItems)}

              <button
                onClick={toggleTheme}
                className="flex items-center gap-4 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 shrink-0" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 shrink-0" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <Button
                onClick={() => logout()}
                variant="default"
                className="w-full"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader />
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
