"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import type { ICreateCategoryRequestBody } from "@/app/api/exercises/categories/route";

type UseCreateCategoryOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export const useCreateCategory = (options: UseCreateCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: ICreateCategoryRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Not authenticated");
      const response = await fetch("/api/exercises/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["exercises-list"] });
      options.onSuccess?.();
    },
    onError: (error) => options.onError?.(error.message),
  });
  return mutation;
};
