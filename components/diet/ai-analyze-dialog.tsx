"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

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
type AnalyzeState =
  | "idle"
  | "photo_preview"
  | "analyzing"
  | "result"
  | "error"
  | "limit_reached";

interface AnalyzeResult {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface AiAnalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onApply: (values: AnalyzeResult) => void;
}

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

export const AiAnalyzeDialog = ({
  open,
  onOpenChange,
  productName,
  onApply,
}: AiAnalyzeDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyzeResult>({
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAnalyzeState("idle");
    setPreviewUrl(null);
    setPhoto(null);
    setResult({ kcal: "", protein: "", carbs: "", fat: "" });
    setError(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleAddPhoto = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalyzeState("photo_preview");
    e.target.value = "";
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhoto(null);
    setAnalyzeState("idle");
  };

  const handleAnalyze = async (photoFile: File | null) => {
    setAnalyzeState("analyzing");
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("product_name", productName);

      if (photoFile) {
        const resized = await resizeImageIfNeeded(photoFile);
        formData.append("image", resized);
      }

      const response = await fetch("/api/diet/analyze-product", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.status === 429) {
        setAnalyzeState("limit_reached");
        return;
      }
      if (response.status === 422) {
        setError(
          "Couldn't analyse this meal — try a clearer description or a better-lit photo."
        );
        setAnalyzeState("error");
        return;
      }
      if (!response.ok) {
        toast.error("Analysis failed, try again.");
        setAnalyzeState(photoFile ? "photo_preview" : "idle");
        return;
      }

      const data = await response.json();
      setResult({
        kcal: data.kcal != null ? String(data.kcal) : "",
        protein: data.protein != null ? String(data.protein) : "",
        carbs: data.carbs != null ? String(data.carbs) : "",
        fat: data.fat != null ? String(data.fat) : "",
      });
      setAnalyzeState("result");
    } catch {
      toast.error("Analysis failed, try again.");
      setAnalyzeState(photoFile ? "photo_preview" : "idle");
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
          <DialogTitle>Analyse meal</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {analyzeState === "idle" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Analysing:{" "}
              <span className="font-medium text-foreground">{productName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Add a photo of the meal for a more accurate estimate. The photo is
              optional.
            </p>
            <Button onClick={handleAddPhoto} className="w-full gap-2">
              Add photo
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAnalyze(null)}
              className="w-full"
            >
              Analyse without photo
            </Button>
          </div>
        )}

        {(analyzeState === "photo_preview" || analyzeState === "analyzing") &&
          previewUrl && (
            <div className="flex flex-col gap-3">
              <img
                src={previewUrl}
                alt="Meal photo"
                className="rounded-md w-full object-contain max-h-48"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAnalyze(photo)}
                  disabled={analyzeState === "analyzing"}
                  className="flex-1 gap-2"
                >
                  {analyzeState === "analyzing" && <Loader size={16} />}
                  {analyzeState === "analyzing" ? "Analysing…" : "Analyse"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  disabled={analyzeState === "analyzing"}
                  className="gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retake
                </Button>
              </div>
            </div>
          )}

        {analyzeState === "analyzing" && !previewUrl && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader size={24} />
            <p className="text-sm text-muted-foreground">Analysing meal…</p>
          </div>
        )}

        {analyzeState === "result" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Check and correct if needed:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["kcal", "protein", "carbs", "fat"] as const).map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <label htmlFor={`analyze-${key}`} className="text-xs font-medium">
                    {key === "kcal"
                      ? "Kcal"
                      : `${key.charAt(0).toUpperCase() + key.slice(1)} [g]`}
                  </label>
                  <Input
                    id={`analyze-${key}`}
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
                Apply
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {analyzeState === "error" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        )}

        {analyzeState === "limit_reached" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Daily AI analysis limit reached. Try again tomorrow.
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
