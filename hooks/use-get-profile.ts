"use client";

// hooks
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import { IGetProfileResponse } from "@/app/api/profile/get-profile/route";

export const useGetProfile = (): UseQueryResult<IGetProfileResponse, Error> => {
  const query = useQuery({
    queryKey: ["get-profile"],
    queryFn: async () => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch("/api/profile/get-profile", {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }

      return response.json();
    },
  });

  return query;
};
