"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";

export const TEMPLATES_QUERY_KEY = ["workout-templates-list"];

export const useListTemplates = () => {
  const query = useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return { templates: [] };
      const response = await fetch("/api/workout-templates/list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to load templates");
      }
      return response.json();
    },
  });
  return query;
};
