"use client";

// hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import { IDeleteBodyMeasurementResponse } from "@/app/api/body-measurements/delete/route";

type UseDeleteBodyMeasurementOptions = {
  onSuccess?: (data: IDeleteBodyMeasurementResponse) => void;
  onError?: (error: string) => void;
};

export const useDeleteBodyMeasurement = ({
  onSuccess,
  onError,
}: UseDeleteBodyMeasurementOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (measurementId: string) => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(
        `/api/body-measurements/delete?id=${encodeURIComponent(measurementId)}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to delete body measurement"
        );
      }

      const data: IDeleteBodyMeasurementResponse = await response.json();

      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data as IDeleteBodyMeasurementResponse);
      }
      queryClient.invalidateQueries({
        queryKey: ["get-body-measurements-history"],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });

  return mutation;
};
