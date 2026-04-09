"use client";

//hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type { IAddMealRequestBody, IAddMealResponse } from "@/app/api/diet/add-meal/route";

type UseAddMealOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export const useAddMeal = ({ onSuccess, onError }: UseAddMealOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IAddMealRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const response = await fetch("/api/diet/add-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save meal");
      }

      const data: IAddMealResponse = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-diet-history"] });
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error.message);
    },
  });
};
