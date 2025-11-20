"use client";

// hooks
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// types
import { IGetProfileResponse } from "@/app/api/profile/get-profile/route";

export const useGetProfile = (): UseQueryResult<IGetProfileResponse, Error> => {
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
