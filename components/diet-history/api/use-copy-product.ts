"use client";

//hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type {
  ICopyProductRequestBody,
  ICopyProductResponse,
} from "@/app/api/diet/copy-product/route";

type UseCopyProductOptions = {
  onSuccess?: (data: ICopyProductResponse) => void;
  onError?: (error: string) => void;
};

export const useCopyProduct = ({ onSuccess, onError }: UseCopyProductOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ICopyProductRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const response = await fetch("/api/diet/copy-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to copy product");
      }

      const data: ICopyProductResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data as ICopyProductResponse);
      queryClient.invalidateQueries({ queryKey: ["get-diet-history"] });
    },
    onError: (error) => {
      if (onError) onError(error.message);
    },
  });
};
