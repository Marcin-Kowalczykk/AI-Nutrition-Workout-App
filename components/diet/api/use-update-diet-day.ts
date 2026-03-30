"use client";

//hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type {
  IUpdateDietDayRequestBody,
  IUpdateDietDayResponse,
} from "@/app/api/diet/update/route";

type UseUpdateDietDayOptions = {
  onSuccess?: (data: IUpdateDietDayResponse) => void;
  onError?: (error: string) => void;
};

export const useUpdateDietDay = ({
  onSuccess,
  onError,
}: UseUpdateDietDayOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: IUpdateDietDayRequestBody) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const response = await fetch("/api/diet/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update diet day");
      }

      const data: IUpdateDietDayResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data as IUpdateDietDayResponse);
      queryClient.invalidateQueries({ queryKey: ["get-diet-history"] });
    },
    onError: (error) => {
      if (onError) onError(error.message);
    },
  });
};
