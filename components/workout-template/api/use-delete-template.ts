"use client";

import { useMutation } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";

type UseDeleteTemplateOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export const useDeleteTemplate = ({
  onSuccess,
  onError,
}: UseDeleteTemplateOptions = {}) => {
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
    onSuccess: () => onSuccess?.(),
    onError: (error) => onError?.(error.message),
  });
  return mutation;
};
