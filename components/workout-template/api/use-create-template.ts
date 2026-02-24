"use client";

import { useMutation } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import type {
  ICreateTemplateRequestBody,
  ICreateTemplateResponse,
} from "@/app/api/workout-templates/create/route";

type UseCreateTemplateOptions = {
  onSuccess?: (data: ICreateTemplateResponse) => void;
  onError?: (error: string) => void;
};

export const useCreateTemplate = ({
  onSuccess,
  onError,
}: UseCreateTemplateOptions = {}) => {
  const mutation = useMutation({
    mutationFn: async (body: ICreateTemplateRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;
      const response = await fetch("/api/workout-templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }
      return response.json() as Promise<ICreateTemplateResponse>;
    },
    onSuccess: (data) => data && onSuccess?.(data),
    onError: (error) => onError?.(error.message),
  });
  return mutation;
};
