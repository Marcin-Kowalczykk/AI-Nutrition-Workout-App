"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { encryptPassword } from "@/lib/crypto";

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginResponse = {
  message: string;
  user: unknown;
};

type ErrorResponse = {
  error: string;
};

export const useLogin = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const encryptedPassword = encryptPassword(password);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: encryptedPassword }),
      });

      const data: LoginResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as ErrorResponse).error || "Login failed");
      }

      return data as LoginResponse;
    },
    onSuccess: () => {
      router.push("/main-page");
      router.refresh();
    },
  });

  return mutation;
};
