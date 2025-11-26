"use client";

// hooks
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// types
import { IGetWorkoutsHistoryResponse } from "@/app/api/workouts/get-workouts-history/route";

type UseGetWorkoutHistoryOptions = {
  startDate?: string;
  endDate?: string;
};

export const useGetWorkoutHistory = (
  options?: UseGetWorkoutHistoryOptions
): UseQueryResult<IGetWorkoutsHistoryResponse, Error> => {
  const { startDate, endDate } = options || {};

  const query = useQuery({
    queryKey: ["get-workout-history", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const url = `/api/workouts/get-workouts-history${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch workout history");
      }

      return response.json();
    },
  });

  return query;
};
