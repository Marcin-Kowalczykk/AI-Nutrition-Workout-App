"use client";

// icons
import {
  HomeIcon,
  NotebookPenIcon,
  UserRoundCogIcon,
  FilesIcon,
  CalculatorIcon,
  ActivityIcon,
} from "lucide-react";

// components
import { SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { CustomMenuItem, NavSettingsType } from "./custom-menu-item";
import LogoutButton from "../logout-button/logout-button";

export function NavMain() {
  const topSideSettings: NavSettingsType[] = [
    {
      title: "Home",
      url: `/main-page`,
      icon: HomeIcon,
    },
    {
      title: "Training plans",
      url: `/training-plans`,
      icon: NotebookPenIcon,
    },
    {
      title: "Diet history",
      url: `/diet-history`,
      icon: FilesIcon,
    },
    {
      title: "Kcal calculator",
      url: `/kcal-calculator`,
      icon: CalculatorIcon,
    },
    {
      title: "Body measurements",
      url: `/body-measurements`,
      icon: ActivityIcon,
    },
  ];

  const bottomSideSettings: NavSettingsType[] = [
    {
      title: "Profile settings",
      url: `/profile-settings`,
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
        <LogoutButton />
      </SidebarMenu>
    </SidebarGroup>
  );
}
