"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { encryptPassword } from "@/lib/crypto";

// types
import {
  IResetPasswordRequestBody,
  IResetPasswordResponse,
} from "@/app/api/auth/reset-password/route";

export const useResetPassword = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ password }: IResetPasswordRequestBody) => {
      const encryptedPassword = encryptPassword(password);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: encryptedPassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      const data: IResetPasswordResponse = await response.json();

      return data;
    },
    onSuccess: () => {
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
  });

  return mutation;
};
