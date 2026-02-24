"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/supabase/get-access-token";

export const useGetTemplate = ({
  templateId,
  enabled,
}: {
  templateId: string | null;
  enabled: boolean;
}) => {
  const query = useQuery({
    queryKey: ["workout-template", templateId],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken || !templateId) return null;
      const response = await fetch(
        `/api/workout-templates/get?id=${encodeURIComponent(templateId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to load template");
      }
      const data = await response.json();
      return data.template;
    },
    enabled: !!templateId && enabled,
  });
  return query;
};
