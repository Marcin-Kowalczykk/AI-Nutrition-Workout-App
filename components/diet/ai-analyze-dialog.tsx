"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ChevronDown, ChevronUp, Info, Plus, RotateCcw } from "lucide-react";

//libs
import { cn } from "@/lib/utils";

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

interface BreakdownItem {
  name: string;
  weight_g: number;
  kcal: number;
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
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [result, setResult] = useState<AnalyzeResult>({
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[] | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNameExpanded, setIsNameExpanded] = useState(false);

  const isNameLong = productName.length > 60;

  const reset = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAnalyzeState("idle");
    setPreviewUrls([]);
    setPhotos([]);
    setResult({ kcal: "", protein: "", carbs: "", fat: "" });
    setConfidence(null);
    setBreakdown(null);
    setWarning(null);
    setError(null);
    setIsNameExpanded(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleAddPhoto = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 2) return;
    setPhotos((prev) => [...prev, file]);
    setPreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
    setAnalyzeState("photo_preview");
    e.target.value = "";
  };

  const handleRetake = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setPhotos([]);
    setAnalyzeState("idle");
  };

  const handleAnalyze = async (photoFiles: File[]) => {
    setAnalyzeState("analyzing");
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("product_name", productName);

      if (photoFiles.length > 0) {
        const resized = await resizeImageIfNeeded(photoFiles[0]);
        formData.append("image", resized);
      }
      if (photoFiles.length > 1) {
        const resized2 = await resizeImageIfNeeded(photoFiles[1]);
        formData.append("image2", resized2);
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
        const errData = await response.json().catch(() => ({}));
        setError(
          errData.error === "Could not parse AI response"
            ? "Analysis failed — please try again."
            : "This doesn't look like a food or meal. Please enter a valid food description."
        );
        setAnalyzeState("error");
        return;
      }
      if (!response.ok) {
        toast.error("Analysis failed, try again.");
        setAnalyzeState(photoFiles.length > 0 ? "photo_preview" : "idle");
        return;
      }

      const data = await response.json();
      setResult({
        kcal: data.kcal != null ? String(data.kcal) : "",
        protein: data.protein != null ? String(data.protein) : "",
        carbs: data.carbs != null ? String(data.carbs) : "",
        fat: data.fat != null ? String(data.fat) : "",
      });
      setConfidence(data.confidence ?? null);
      setBreakdown(data.breakdown ?? null);
      setWarning(data.warning ?? null);
      setAnalyzeState("result");
    } catch {
      toast.error("Analysis failed, try again.");
      setAnalyzeState(photoFiles.length > 0 ? "photo_preview" : "idle");
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

        {productName && (
          <div className="flex flex-col gap-1 text-sm">
            <div>
              <span className="text-muted-foreground">Analysing: </span>
              <span
                className={cn(
                  "font-medium text-foreground",
                  !isNameExpanded && isNameLong && "line-clamp-2"
                )}
              >
                {productName}
              </span>
            </div>
            {isNameLong && (
              <button
                type="button"
                className="self-start flex items-center gap-0.5 text-xs text-primary-element"
                onClick={() => setIsNameExpanded((p) => !p)}
              >
                {isNameExpanded ? (
                  <><ChevronUp className="h-3 w-3" /> Show less</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> Show more</>
                )}
              </button>
            )}
          </div>
        )}

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
            <div className="rounded-md border border-border bg-muted/40 p-3 flex flex-col gap-1.5">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary-element shrink-0" />
                Tips for a more accurate estimate:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
                <li>Place a fork or spoon next to the plate (scale reference)</li>
                <li>Shoot from directly above (90°)</li>
                <li>Include the whole meal in the frame</li>
                <li>Good lighting, no filters</li>
                <li>Photo before eating</li>
              </ul>
            </div>
            <Button onClick={handleAddPhoto} className="w-full gap-2">
              Add photo
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAnalyze([])}
              className="w-full"
            >
              Analyse without photo
            </Button>
          </div>
        )}

        {(analyzeState === "photo_preview" || analyzeState === "analyzing") &&
          previewUrls.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Meal photo ${i + 1}`}
                    className="rounded-md w-full object-contain max-h-40"
                  />
                ))}
                {photos.length < 2 && analyzeState !== "analyzing" && (
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 max-h-40 min-h-24 text-muted-foreground hover:border-primary-element hover:text-primary-element transition-colors"
                  >
                    <div className="relative">
                      <Camera className="h-6 w-6" />
                      <Plus className="h-3 w-3 absolute -top-0.5 -right-1.5" strokeWidth={3} />
                    </div>
                    <span className="text-xs">Add 2nd photo</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAnalyze(photos)}
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

        {analyzeState === "analyzing" && previewUrls.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader size={24} />
            <p className="text-sm text-muted-foreground">Analysing meal…</p>
          </div>
        )}

        {analyzeState === "result" && (
          <div className="flex flex-col gap-3">
            {confidence && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${
                confidence === "high"
                  ? "text-green-500"
                  : confidence === "medium"
                    ? "text-amber-500"
                    : "text-destructive"
              }`}>
                {confidence === "high" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                )}
                {confidence === "high"
                  ? "High confidence"
                  : confidence === "medium"
                    ? "Medium confidence"
                    : "Low confidence — results may be inaccurate"}
              </div>
            )}
            {breakdown && breakdown.length > 0 && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Meal components:</p>
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">• {item.name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{item.weight_g}g · {item.kcal} kcal</span>
                  </div>
                ))}
              </div>
            )}
            {warning && (
              <div className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {warning}
              </div>
            )}
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
