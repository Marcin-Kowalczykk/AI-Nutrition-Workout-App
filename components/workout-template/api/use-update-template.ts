"use client";

import { useMutation } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import type {
  IUpdateTemplateRequestBody,
  IUpdateTemplateResponse,
} from "@/app/api/workout-templates/update/route";

type UseUpdateTemplateOptions = {
  onSuccess?: (data: IUpdateTemplateResponse) => void;
  onError?: (error: string) => void;
};

export const useUpdateTemplate = ({
  onSuccess,
  onError,
}: UseUpdateTemplateOptions = {}) => {
  const mutation = useMutation({
    mutationFn: async (body: IUpdateTemplateRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;
      const response = await fetch("/api/workout-templates/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }
      return response.json() as Promise<IUpdateTemplateResponse>;
    },
    onSuccess: (data) => data && onSuccess?.(data),
    onError: (error) => onError?.(error.message),
  });
  return mutation;
};
