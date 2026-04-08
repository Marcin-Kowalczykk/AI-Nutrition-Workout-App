"use client";

//hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

//utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type { IDeleteDietDayResponse } from "@/app/api/diet/delete/route";

type UseDeleteDietDayOptions = {
  onSuccess?: (data: IDeleteDietDayResponse) => void;
  onError?: (error: string) => void;
};

export const useDeleteDietDay = ({
  onSuccess,
  onError,
}: UseDeleteDietDayOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;

      const response = await fetch(
        `/api/diet/delete?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete diet day");
      }

      const data: IDeleteDietDayResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data as IDeleteDietDayResponse);
      queryClient.invalidateQueries({ queryKey: ["get-diet-history"] });
    },
    onError: (error) => {
      if (onError) onError(error.message);
    },
  });
};
