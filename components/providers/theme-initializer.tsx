"use client";

// hooks
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useGetProfile } from "@/hooks/use-get-profile";

const ThemeInitializer = () => {
  const { setTheme } = useTheme();
  const { data: profileData, error } = useGetProfile();

  useEffect(() => {
    if (error || !profileData) {
      return;
    }

    const themeFromDatabase = profileData.profile.theme;

    if (themeFromDatabase) {
      setTheme(themeFromDatabase);
    }
  }, [profileData]);

  return null;
};

export default ThemeInitializer;
