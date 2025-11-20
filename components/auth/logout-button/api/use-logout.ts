"use client";

// dependencies
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// types
import { ILogoutResponse } from "@/app/api/auth/logout/route";

export const useLogout = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: ILogoutResponse = await response.json();

      return data;
    },
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });

  return mutation;
};
