"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import type {
  ICreateTemplateRequestBody,
  ICreateTemplateResponse,
} from "@/app/api/workout-templates/create/route";
import { TEMPLATES_QUERY_KEY } from "./use-list-templates";

type UseCreateTemplateOptions = {
  onSuccess?: (data: ICreateTemplateResponse) => void;
  onError?: (error: string) => void;
};

export const useCreateTemplate = ({
  onSuccess,
  onError,
}: UseCreateTemplateOptions = {}) => {
  const queryClient = useQueryClient();

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
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
        onSuccess?.(data);
      }
    },
    onError: (error) => onError?.(error.message),
  });
  return mutation;
};
