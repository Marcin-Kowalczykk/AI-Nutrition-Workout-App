"use client";

// dependencies
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useProfile = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not found");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
      }

      return {
        user: {
          email: user.email || "",
          id: user.id,
        },
        profile: {
          full_name: profile?.full_name || "",
        },
      };
    },
  });
};
