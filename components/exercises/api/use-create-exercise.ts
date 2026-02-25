"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import type { ICreateExerciseRequestBody } from "@/app/api/exercises/route";

type UseCreateExerciseOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export const useCreateExercise = (options: UseCreateExerciseOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: ICreateExerciseRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Not authenticated");
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create exercise");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises-list"] });
      options.onSuccess?.();
    },
    onError: (error) => options.onError?.(error.message),
  });
  return mutation;
};
