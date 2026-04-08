"use client";

//hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type { ICopyMealRequestBody, ICopyMealResponse } from "@/app/api/diet/copy-meal/route";

type UseCopyMealOptions = {
  onSuccess?: (data: ICopyMealResponse) => void;
  onError?: (error: string) => void;
};

export const useCopyMeal = ({ onSuccess, onError }: UseCopyMealOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ICopyMealRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const response = await fetch("/api/diet/copy-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to copy meal");
      }

      const data: ICopyMealResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data as ICopyMealResponse);
      queryClient.invalidateQueries({ queryKey: ["get-diet-history"] });
    },
    onError: (error) => {
      if (onError) onError(error.message);
    },
  });
};
