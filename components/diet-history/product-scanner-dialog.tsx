"use client";

import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";

//libs
import { toast } from "sonner";

//hooks
import { getAccessToken } from "@/lib/supabase/get-access-token";

//components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";

//types
type ScanState = "idle" | "preview" | "analyzing" | "result" | "error" | "limit_reached";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

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

interface ScanResult {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface ProductScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (values: ScanResult) => void;
}

export const ProductScannerDialog = ({
  open,
  onOpenChange,
  onApply,
}: ProductScannerDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult>({ kcal: "", protein: "", carbs: "", fat: "" });
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScanState("idle");
    setPreviewUrl(null);
    setPhoto(null);
    setResult({ kcal: "", protein: "", carbs: "", fat: "" });
    setError(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleOpenCamera = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState("preview");
    e.target.value = "";
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    reset();
  };

  const handleAnalyze = async () => {
    if (!photo) return;
    setScanState("analyzing");
    try {
      const resized = await resizeImageIfNeeded(photo);
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("image", resized);

      const response = await fetch("/api/diet/scan-product", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.status === 429) {
        setScanState("limit_reached");
        return;
      }
      if (response.status === 422) {
        setError("Couldn't read the label clearly — try a better-lit photo.");
        setScanState("error");
        return;
      }
      if (!response.ok) {
        toast.error("Analysis failed, try again.");
        setScanState("preview");
        return;
      }

      const data = await response.json();
      setResult({
        kcal: data.kcal_per_100g != null ? String(data.kcal_per_100g) : "",
        protein: data.protein_per_100g != null ? String(data.protein_per_100g) : "",
        carbs: data.carbs_per_100g != null ? String(data.carbs_per_100g) : "",
        fat: data.fat_per_100g != null ? String(data.fat_per_100g) : "",
      });
      setScanState("result");
    } catch {
      toast.error("Analysis failed, try again.");
      setScanState("preview");
    }
  };

  const handleApply = () => {
    onApply(result);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan product</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {scanState === "idle" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Take a photo of the nutrition label to fill in the 100g values automatically.
            </p>
            <Button onClick={handleOpenCamera} className="gap-2">
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
          </div>
        )}

        {(scanState === "preview" || scanState === "analyzing") && previewUrl && (
          <div className="flex flex-col gap-3">
            <img
              src={previewUrl}
              alt="Nutrition label"
              className="rounded-md w-full object-contain max-h-48"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={scanState === "analyzing"}
                className="flex-1 gap-2"
              >
                {scanState === "analyzing" && <Loader size={16} />}
                {scanState === "analyzing" ? "Analyzing…" : "Analyze"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRetake}
                disabled={scanState === "analyzing"}
                className="gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retake
              </Button>
            </div>
          </div>
        )}

        {scanState === "result" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Values per 100g — check and correct if needed:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["kcal", "protein", "carbs", "fat"] as const).map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium">
                    {key === "kcal" ? "Kcal" : key.charAt(0).toUpperCase() + key.slice(1)} / 100g
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={result[key]}
                    onChange={(e) =>
                      setResult((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="h-8"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                Apply to calculator
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {scanState === "error" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={handleRetake} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Retake
            </Button>
          </div>
        )}

        {scanState === "limit_reached" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Daily scan limit reached. Try again tomorrow.
            </p>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
