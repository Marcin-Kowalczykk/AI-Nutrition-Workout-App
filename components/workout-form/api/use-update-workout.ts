"use client";

// hooks
import { useMutation } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import {
  IUpdateWorkoutRequestBody,
  IUpdateWorkoutResponse,
} from "@/app/api/workouts/update-workout/route";

type UseUpdateWorkoutOptions = {
  onSuccess?: (data: IUpdateWorkoutResponse) => void;
  onError?: (error: string) => void;
};

export const useUpdateWorkout = ({
  onSuccess,
  onError,
}: UseUpdateWorkoutOptions = {}) => {
  const mutation = useMutation({
    mutationFn: async (body: IUpdateWorkoutRequestBody) => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch("/api/workouts/update-workout", {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update workout");
      }

      const data: IUpdateWorkoutResponse = await response.json();

      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data as IUpdateWorkoutResponse);
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
