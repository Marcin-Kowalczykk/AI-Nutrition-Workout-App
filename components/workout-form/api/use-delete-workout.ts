"use client";

// hooks
import { useMutation } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import { IDeleteWorkoutResponse } from "@/app/api/workouts/delete-workout/route";

type UseDeleteWorkoutOptions = {
  onSuccess?: (data: IDeleteWorkoutResponse) => void;
  onError?: (error: string) => void;
};

export const useDeleteWorkout = ({
  onSuccess,
  onError,
}: UseDeleteWorkoutOptions = {}) => {
  const mutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(
        `/api/workouts/delete-workout?id=${encodeURIComponent(workoutId)}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete workout");
      }

      const data: IDeleteWorkoutResponse = await response.json();

      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data as IDeleteWorkoutResponse);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });

  return mutation;
};
