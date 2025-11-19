"use client";

// dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

type UpdateProfileCredentials = {
  fullName?: string;
  password?: string;
  theme?: string;
};

export const useUpdateProfile = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();

  const mutation = useMutation({
    mutationFn: async ({
      fullName,
      password,
      theme,
    }: UpdateProfileCredentials) => {
      const response = await fetch("/api/profile/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, password, theme }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Update theme in next-themes if theme was provided
      if (theme) {
        setTheme(theme);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.refresh();
    },
  });

  return mutation;
};
