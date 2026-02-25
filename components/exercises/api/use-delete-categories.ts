"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";

type UseDeleteCategoriesOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export const useDeleteCategories = (options: UseDeleteCategoriesOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Not authenticated");
      const response = await fetch("/api/exercises/categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete categories");
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
