"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { encryptPassword } from "@/lib/crypto";

type RegisterCredentials = {
  email: string;
  password: string;
  fullName: string;
};

type RegisterResponse = {
  message: string;
  user: unknown;
};

type ErrorResponse = {
  error: string;
};

export const useRegister = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ email, password, fullName }: RegisterCredentials) => {
      const encryptedPassword = encryptPassword(password);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: encryptedPassword, fullName }),
      });

      const data: RegisterResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as ErrorResponse).error || "Registration failed");
      }

      return data as RegisterResponse;
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
