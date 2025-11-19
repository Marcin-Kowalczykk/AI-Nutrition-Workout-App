"use client";

// dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { encryptPassword } from "@/lib/crypto";

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
      const encryptedPassword = password
        ? encryptPassword(password)
        : undefined;

      const response = await fetch("/api/profile/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          password: encryptedPassword,
          theme,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

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
