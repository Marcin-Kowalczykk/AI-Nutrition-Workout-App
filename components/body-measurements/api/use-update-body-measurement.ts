"use client";

// hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import {
  IUpdateBodyMeasurementRequestBody,
  IUpdateBodyMeasurementResponse,
} from "@/app/api/body-measurements/update/route";

type UseUpdateBodyMeasurementOptions = {
  measurementId: string | null;
  onSuccess?: (data: IUpdateBodyMeasurementResponse) => void;
  onError?: (error: string) => void;
};

export const useUpdateBodyMeasurement = ({
  measurementId,
  onSuccess,
  onError,
}: UseUpdateBodyMeasurementOptions) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: IUpdateBodyMeasurementRequestBody) => {
      const accessToken = await getAccessToken();

      if (!accessToken || !measurementId) return null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch(
        `/api/body-measurements/update?id=${encodeURIComponent(measurementId)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update body measurement"
        );
      }

      const data: IUpdateBodyMeasurementResponse = await response.json();

      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data as IUpdateBodyMeasurementResponse);
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
