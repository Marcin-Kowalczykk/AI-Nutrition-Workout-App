"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { encryptPassword } from "@/lib/crypto";

// types
import {
  IRegisterRequestBody,
  IRegisterResponse,
} from "@/app/api/auth/register/route";

export const useRegister = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ email, password, fullName }: IRegisterRequestBody) => {
      const encryptedPassword = encryptPassword(password);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: encryptedPassword, fullName }),
      });

      const data: IRegisterResponse = await response.json();

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        router.push("/main-page");
        router.refresh();
      }
    },
  });

  return mutation;
};
