"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { encryptPassword } from "@/lib/crypto";

type ResetPasswordCredentials = {
  password: string;
};

type ResetPasswordResponse = {
  message: string;
};

type ErrorResponse = {
  error: string;
};

export const useResetPassword = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ password }: ResetPasswordCredentials) => {
      const encryptedPassword = encryptPassword(password);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: encryptedPassword }),
      });

      const data: ResetPasswordResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as ErrorResponse).error || "Failed to reset password"
        );
      }

      return data as ResetPasswordResponse;
    },
    onSuccess: () => {
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
  });

  return mutation;
};
