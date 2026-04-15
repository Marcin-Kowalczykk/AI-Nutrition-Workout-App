"use client";

// dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// types
import { ILogoutResponse } from "@/app/api/auth/logout/route";

// components
import { clearLastRoute } from "@/components/shared/route-restorer/route-restorer";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

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
      clearLastRoute();
      queryClient.clear();
      localStorage.removeItem("tanstack-query");
      router.push("/login");
      router.refresh();
    },
  });

  return mutation;
};
