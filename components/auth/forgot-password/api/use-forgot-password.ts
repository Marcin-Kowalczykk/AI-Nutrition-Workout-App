"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";

// types
import {
  IForgotPasswordRequestBody,
  IForgotPasswordResponse,
} from "@/app/api/auth/forgot-password/route";

export const useForgotPassword = () => {
  const mutation = useMutation({
    mutationFn: async ({ email }: IForgotPasswordRequestBody) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: IForgotPasswordResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      return data;
    },
  });

  return mutation;
};
