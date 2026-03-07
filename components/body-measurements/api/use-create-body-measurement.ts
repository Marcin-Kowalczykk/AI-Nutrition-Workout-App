"use client";

// hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

// utils
import { getAccessToken } from "@/lib/supabase/get-access-token";

// types
import {
  ICreateBodyMeasurementRequestBody,
  ICreateBodyMeasurementResponse,
} from "@/app/api/body-measurements/create/route";

type UseCreateBodyMeasurementOptions = {
  onSuccess?: (data: ICreateBodyMeasurementResponse) => void;
  onError?: (error: string) => void;
};

export const useCreateBodyMeasurement = ({
  onSuccess,
  onError,
}: UseCreateBodyMeasurementOptions = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: ICreateBodyMeasurementRequestBody) => {
      const accessToken = await getAccessToken();

      if (!accessToken) return null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await fetch("/api/body-measurements/create", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create body measurement");
      }

      const data: ICreateBodyMeasurementResponse = await response.json();

      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data as ICreateBodyMeasurementResponse);
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
