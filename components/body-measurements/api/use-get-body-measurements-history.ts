"use client";

// hooks
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import { IGetBodyMeasurementsHistoryResponse } from "@/app/api/body-measurements/get-history/route";

type UseGetBodyMeasurementsHistoryOptions = {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
};

export const useGetBodyMeasurementsHistory = (
  options?: UseGetBodyMeasurementsHistoryOptions
): UseQueryResult<IGetBodyMeasurementsHistoryResponse, Error> => {
  const { startDate, endDate, enabled } = options || {};

  const query = useQuery({
    queryKey: ["get-body-measurements-history", startDate, endDate],
    queryFn: async () => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const url = `/api/body-measurements/get-history${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch body measurements history"
        );
      }

      return response.json();
    },
    enabled: enabled ?? true,
  });

  return query;
};
