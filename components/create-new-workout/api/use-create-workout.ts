"use client";

// hooks
import { useMutation } from "@tanstack/react-query";

// types
import {
  ICreateWorkoutRequestBody,
  ICreateWorkoutResponse,
} from "@/app/api/workouts/create-new-workout/route";

type UseCreateWorkoutOptions = {
  onSuccess?: (data: ICreateWorkoutResponse) => void;
  onError?: (error: string) => void;
};

export const useCreateWorkout = ({
  onSuccess,
  onError,
}: UseCreateWorkoutOptions = {}) => {
  const mutation = useMutation({
    mutationFn: async (body: ICreateWorkoutRequestBody) => {
      const response = await fetch("/api/workouts/create-new-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create workout");
      }

      const data: ICreateWorkoutResponse = await response.json();

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
