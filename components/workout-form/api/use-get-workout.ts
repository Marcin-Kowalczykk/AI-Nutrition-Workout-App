"use client";

// hooks
import { useQuery } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import { IGetWorkoutResponse } from "@/app/api/workouts/get-workout/route";
import { IWorkoutItem } from "@/app/api/workouts/types";

type UseGetWorkoutOptions = {
  workoutId: string | null;
  enabled?: boolean;
};

export const useGetWorkout = ({
  workoutId,
  enabled = true,
}: UseGetWorkoutOptions) => {
  const query = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: async (): Promise<IWorkoutItem | null> => {
      if (!workoutId) return null;

      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(
        `/api/workouts/get-workout?id=${workoutId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch workout");
      }

      const data: IGetWorkoutResponse = await response.json();

      return data.workout;
    },
    enabled: enabled && !!workoutId,
  });

  return query;
};
