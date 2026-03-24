"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import { TEMPLATES_QUERY_KEY } from "./use-list-templates";

type UseDeleteTemplateOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export const useDeleteTemplate = ({
  onSuccess,
  onError,
}: UseDeleteTemplateOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (templateId: string) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;
      const response = await fetch(
        `/api/workout-templates/delete?id=${encodeURIComponent(templateId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }
      return response.json();
    },
    onSuccess: (_, templateId) => {
      queryClient.removeQueries({ queryKey: ["workout-template", templateId] });
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
      onSuccess?.();
    },
    onError: (error) => onError?.(error.message),
  });
  return mutation;
};
