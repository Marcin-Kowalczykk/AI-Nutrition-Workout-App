"use client";

// dependencies
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UpdateProfileCredentials = {
  fullName: string;
  password?: string;
};

export const useUpdateProfile = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const mutation = useMutation({
    mutationFn: async ({ fullName, password }: UpdateProfileCredentials) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (password) {
        const passwordResponse = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(errorData.error || "Failed to update password");
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.refresh();
    },
  });

  return mutation;
};
