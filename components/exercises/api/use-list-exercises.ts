"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";

export const EXERCISES_QUERY_KEY = ["exercises-list"];

export const useListExercises = () => {
  const query = useQuery({
    queryKey: EXERCISES_QUERY_KEY,
    queryFn: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return { exercises: [] };
      const response = await fetch("/api/exercises", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to load exercises");
      }
      return response.json();
    },
  });
  return query;
};
