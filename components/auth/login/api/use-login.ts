"use client";

// hooks
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// utils
import { encryptPassword } from "@/lib/crypto";

// types
import { ILoginRequestBody, ILoginResponse } from "@/app/api/auth/login/route";

export const useLogin = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ email, password }: ILoginRequestBody) => {
      const encryptedPassword = encryptPassword(password);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: encryptedPassword }),
      });

      const data: ILoginResponse = await response.json();

      if (!response.ok) {
        throw new Error("Login failed");
      }

      return data;
    },
    onSuccess: () => {
      router.push("/main-page");
      router.refresh();
    },
  });

  return mutation;
};
