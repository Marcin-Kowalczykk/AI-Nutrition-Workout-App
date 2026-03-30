"use client";

//hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type {
  ICreateDietDayRequestBody,
  ICreateDietDayResponse,
} from "@/app/api/diet/create/route";

type UseCreateDietDayOptions = {
  onSuccess?: (data: ICreateDietDayResponse) => void;
  onError?: (error: string) => void;
};

export const useCreateDietDay = ({
  onSuccess,
  onError,
}: UseCreateDietDayOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ICreateDietDayRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const response = await fetch("/api/diet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create diet day");
      }

      const data: ICreateDietDayResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data as ICreateDietDayResponse);
      queryClient.invalidateQueries({ queryKey: ["get-diet-history"] });
    },
    onError: (error) => {
      if (onError) onError(error.message);
    },
  });
};
