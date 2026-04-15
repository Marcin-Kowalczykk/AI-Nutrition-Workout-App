"use client";

// dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// types
import { ILogoutResponse } from "@/app/api/auth/logout/route";

// components
import { clearLastRoute } from "@/components/shared/route-restorer/route-restorer";
import { createClient } from "@/lib/supabase/client";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: ILogoutResponse = await response.json();

      return { ...data, userId };
    },
    onSuccess: ({ userId }) => {
      clearLastRoute(userId);
      queryClient.clear();
      localStorage.removeItem("tanstack-query");
      router.push("/login");
      router.refresh();
    },
  });

  return mutation;
};
