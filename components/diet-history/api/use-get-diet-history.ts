"use client";

//hooks
import { useQuery, UseQueryResult } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type { IGetDietHistoryResponse } from "@/app/api/diet/get-history/route";

type UseGetDietHistoryOptions = {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
};

export const useGetDietHistory = (
  options?: UseGetDietHistoryOptions
): UseQueryResult<IGetDietHistoryResponse, Error> => {
  const { startDate, endDate, enabled } = options ?? {};

  return useQuery({
    queryKey: ["get-diet-history", startDate, endDate],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const url = `/api/diet/get-history${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch diet history");
      }

      return response.json();
    },
    enabled: enabled ?? true,
  });
};
