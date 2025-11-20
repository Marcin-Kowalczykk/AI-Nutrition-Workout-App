"use client";

// hooks
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "next-themes";

// lib
import { encryptPassword } from "@/lib/crypto";

// types
import {
  IUpdateProfileRequestBody,
  IUpdateProfileResponse,
} from "@/app/api/profile/update-profile/route";

type UseUpdateProfileOptions = {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
};

export const useUpdateProfile = ({
  onSuccess,
  onError,
}: UseUpdateProfileOptions) => {
  const { setTheme } = useTheme();

  const mutation = useMutation({
    mutationFn: async ({
      fullName,
      password,
      theme,
    }: IUpdateProfileRequestBody) => {
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

      const data: IUpdateProfileResponse = await response.json();

      return data.message;
    },
    onSuccess: (message) => {
      if (onSuccess) {
        onSuccess(message);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });

  return mutation;
};
