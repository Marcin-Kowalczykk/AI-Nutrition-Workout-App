"use client";

import { useState } from "react";

//libs
import { toast } from "sonner";
import { getAccessToken } from "@/lib/supabase/get-access-token";
import { resizeImageForUpload } from "@/components/shared/diet/helpers/image-resize";

//types
import type { ScanApiResponse, ScanState } from "./scan-product.types";

interface UseScanProductReturn {
  scanState: ScanState;
  apiResult: ScanApiResponse | null;
  error: string | null;
  analyze: (file: File) => Promise<ScanApiResponse | null>;
  reset: () => void;
}

export const useScanProduct = (): UseScanProductReturn => {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [apiResult, setApiResult] = useState<ScanApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setScanState("idle");
    setApiResult(null);
    setError(null);
  };

  const analyze = async (file: File): Promise<ScanApiResponse | null> => {
    setScanState("analyzing");
    setError(null);
    try {
      const resized = await resizeImageForUpload(file);
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("image", resized);

      const response = await fetch("/api/diet/scan-product", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.status === 429) { setScanState("limit_reached"); return null; }
      if (response.status === 422) {
        setError("Couldn't read the label clearly — try a better-lit photo.");
        setScanState("error");
        return null;
      }
      if (!response.ok) {
        toast.error("Analysis failed, try again.");
        setScanState("preview");
        return null;
      }

      const data: ScanApiResponse = await response.json();
      setApiResult(data);
      setScanState("result");
      return data;
    } catch {
      toast.error("Analysis failed, try again.");
      setScanState("preview");
      return null;
    }
  };

  return { scanState, apiResult, error, analyze, reset };
};
