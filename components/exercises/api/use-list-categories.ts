"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";

export const EXERCISE_CATEGORIES_QUERY_KEY = ["exercise-categories-list"];

export const useListCategories = () => {
  const query = useQuery({
    queryKey: EXERCISE_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return { categories: [] };
      const response = await fetch("/api/exercises/categories", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to load categories");
      }
      return response.json();
    },
  });
  return query;
};
