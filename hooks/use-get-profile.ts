"use client";

// hooks
import { useQuery } from "@tanstack/react-query";

export const useGetProfile = () => {
  const query = useQuery({
    queryKey: ["get-profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile/get-profile");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }

      return response.json();
    },
  });

  return query;
};
