"use client";

// icons
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
} from "lucide-react";

// components
import { SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { CustomMenuItem, NavSettingsType } from "./custom-menu-item";
import LogoutButton from "../../auth/logout-button/logout-button";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { clearAllFormCache } from "@/lib/form-cache";

export enum EnableRoutes {
  WorkoutHistory = "/main-page",
  CreateNewWorkout = "/workout/create",
  Templates = "/workout/template",
  Exercises = "/exercises",
  Records = "/records",
  DietHistory = "/diet-history",
  KcalCalculator = "/kcal-calculator",
  BodyMeasurements = "/body-measurements",
  ProfileSettings = "/profile-settings",
}

export enum NavMainTitles {
  WorkoutHistory = "Workout history",
  CreateNewWorkout = "Create new workout",
  EditWorkout = "Edit workout",
  Templates = "Templates",
  CreateTemplate = "Create template",
  EditTemplate = "Edit template",
  Exercises = "Exercises",
  Records = "Records",
  DietHistory = "Diet history",
  KcalCalculator = "Kcal calculator",
  BodyMeasurements = "Body measurements",
  ProfileSettings = "Profile settings",
}

export function NavMain() {
  const handleCreateWorkoutClick = () => {
    void clearAllFormCache();
  };

  const topSideSettings: NavSettingsType[] = [
    {
      title: NavMainTitles.WorkoutHistory,
      url: EnableRoutes.WorkoutHistory,
      icon: HomeIcon,
    },
    {
      title: NavMainTitles.CreateNewWorkout,
      url: EnableRoutes.CreateNewWorkout,
      icon: NotebookPenIcon,
      onClick: handleCreateWorkoutClick,
    },
    {
      title: NavMainTitles.Templates,
      url: EnableRoutes.Templates,
      icon: FileStackIcon,
    },
    {
      title: NavMainTitles.Exercises,
      url: EnableRoutes.Exercises,
      icon: DumbbellIcon,
    },
    {
      title: NavMainTitles.Records,
      url: EnableRoutes.Records,
      icon: TrophyIcon,
    },
    {
      title: NavMainTitles.DietHistory,
      url: EnableRoutes.DietHistory,
      icon: FilesIcon,
      comingSoon: true,
    },
    {
      title: NavMainTitles.KcalCalculator,
      url: EnableRoutes.KcalCalculator,
      icon: CalculatorIcon,
      comingSoon: true,
    },
    {
      title: NavMainTitles.BodyMeasurements,
      url: EnableRoutes.BodyMeasurements,
      icon: ActivityIcon,
    },
  ];

  const bottomSideSettings: NavSettingsType[] = [
    {
      title: NavMainTitles.ProfileSettings,
      url: EnableRoutes.ProfileSettings,
      icon: UserRoundCogIcon,
    },
  ];

  return (
    <SidebarGroup className="flex-1 flex flex-col justify-between gap-4 text-muted-foreground p-4">
      <SidebarMenu className="gap-4 group-data-[collapsible=icon]:items-center">
        {topSideSettings.map((item, index) => (
          <CustomMenuItem key={index + item.title} {...item} />
        ))}
      </SidebarMenu>
      <SidebarMenu className="gap-4 group-data-[collapsible=icon]:items-center">
        {bottomSideSettings.map((item, index) => (
          <CustomMenuItem key={index + item.title} {...item} />
        ))}
        <ThemeToggle />
        <LogoutButton />
      </SidebarMenu>
    </SidebarGroup>
  );
}
