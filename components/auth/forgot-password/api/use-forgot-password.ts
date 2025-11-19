"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";

type ForgotPasswordCredentials = {
  email: string;
};

type ForgotPasswordResponse = {
  message: string;
};

type ErrorResponse = {
  error: string;
};

export const useForgotPassword = () => {
  const mutation = useMutation({
    mutationFn: async ({ email }: ForgotPasswordCredentials) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: ForgotPasswordResponse | ErrorResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          (data as ErrorResponse).error || "Failed to send reset email"
        );
      }

      return data as ForgotPasswordResponse;
    },
  });

  return mutation;
};
