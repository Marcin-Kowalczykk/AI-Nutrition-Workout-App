"use client";

// hooks
import { useMutation } from "@tanstack/react-query";

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
      const response = await fetch("/api/workouts/update-workout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
        onSuccess(data);
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
