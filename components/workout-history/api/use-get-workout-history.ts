"use client";

// hooks
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import { IGetWorkoutsHistoryResponse } from "@/app/api/workouts/get-workouts-history/route";

type UseGetWorkoutHistoryOptions = {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
  limit?: number; // legacy, prefer page + pageSize
  page?: number;
  pageSize?: number;
};

export const useGetWorkoutHistory = (
  options?: UseGetWorkoutHistoryOptions
): UseQueryResult<IGetWorkoutsHistoryResponse, Error> => {
  const { startDate, endDate, enabled, limit, page, pageSize } = options || {};

  const query = useQuery({
    queryKey: ["get-workout-history", startDate, endDate, limit, page, pageSize],
    queryFn: async () => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (typeof page === "number" && typeof pageSize === "number") {
        params.append("page", String(page));
        params.append("page_size", String(pageSize));
      } else if (typeof limit === "number") {
        params.append("limit", String(limit));
      }

      const url = `/api/workouts/get-workouts-history${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch workout history");
      }

      return response.json();
    },
    enabled: enabled ?? true,
  });

  return query;
};
