"use client";

// hooks
import { useMutation } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

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
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch("/api/workouts/create-new-workout", {
        method: "POST",
        headers,
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
        onSuccess(data as ICreateWorkoutResponse);
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
