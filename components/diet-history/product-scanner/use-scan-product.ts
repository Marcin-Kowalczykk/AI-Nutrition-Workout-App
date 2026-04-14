"use client";

import { useState } from "react";

//libs
import { toast } from "sonner";
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type { ScanApiResponse, ScanState } from "./scan-product.types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const resizeImageIfNeeded = (file: File): Promise<File> => {
  if (file.size <= MAX_IMAGE_BYTES) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.sqrt(MAX_IMAGE_BYTES / file.size);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(img.width * ratio);
      canvas.height = Math.floor(img.height * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
};

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
      const resized = await resizeImageIfNeeded(file);
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
