"use client";

//libs
import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";

//hooks
import { useScanProduct } from "./use-scan-product";

//components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";
import { ScanVariantTiles } from "./scan-variant-tiles";
import { ScanResultFields } from "./scan-result-fields";

//types
import type { ScanResult, ScanVariant } from "./scan-product.types";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ScanVariant | null>(null);
  const [editedValues, setEditedValues] = useState<ScanResult>({
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const { scanState, apiResult, error, analyze, reset } = useScanProduct();

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhoto(null);
    setSelectedVariant(null);
    setEditedValues({ kcal: "", protein: "", carbs: "", fat: "" });
    reset();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhoto(null);
    setSelectedVariant(null);
    setEditedValues({ kcal: "", protein: "", carbs: "", fat: "" });
    reset();
  };

  const handleAnalyze = async () => {
    if (!photo) return;
    const result = await analyze(photo);
    // When per-100g only (no whole_product), pre-fill fields immediately
    if (result && !result.whole_product) {
      setEditedValues({
        kcal: result.kcal_per_100g != null ? String(result.kcal_per_100g) : "",
        protein: result.protein_per_100g != null ? String(result.protein_per_100g) : "",
        carbs: result.carbs_per_100g != null ? String(result.carbs_per_100g) : "",
        fat: result.fat_per_100g != null ? String(result.fat_per_100g) : "",
      });
    }
  };

  const handleVariantSelect = (variant: ScanVariant) => {
    setSelectedVariant(variant);
    if (!apiResult) return;

    if (variant === "per_100g") {
      setEditedValues({
        kcal: apiResult.kcal_per_100g != null ? String(apiResult.kcal_per_100g) : "",
        protein: apiResult.protein_per_100g != null ? String(apiResult.protein_per_100g) : "",
        carbs: apiResult.carbs_per_100g != null ? String(apiResult.carbs_per_100g) : "",
        fat: apiResult.fat_per_100g != null ? String(apiResult.fat_per_100g) : "",
      });
    } else {
      const wp = apiResult.whole_product;
      if (!wp) return;
      setEditedValues({
        kcal: String(wp.kcal),
        protein: String(wp.protein),
        carbs: String(wp.carbs),
        fat: String(wp.fat),
        grams: String(wp.grams),
      });
    }
  };

  const handleFieldChange = (key: keyof Omit<ScanResult, "grams">, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(editedValues);
    handleClose();
  };

  // When apiResult has no whole_product, skip tile selection and auto-populate fields
  const hasChoice = apiResult?.whole_product != null;
  const canApply =
    !hasChoice
      ? scanState === "result"
      : scanState === "result" && selectedVariant !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

        {scanState === "idle" && !previewUrl && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Take a photo of the nutrition label to fill in values automatically.
            </p>
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
          </div>
        )}

        {previewUrl && (scanState === "idle" || scanState === "preview" || scanState === "analyzing") && (
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- transient blob URL, next/image cannot optimise it */}
            <img
              src={previewUrl}
              alt="Nutrition label"
              className="max-h-48 w-full rounded-md object-contain"
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

        {scanState === "result" && apiResult && (
          <div className="flex flex-col gap-3">
            {hasChoice && (
              <>
                <p className="text-xs text-muted-foreground">
                  Found values for 100g and full product — choose one:
                </p>
                <ScanVariantTiles
                  apiResult={apiResult}
                  selected={selectedVariant}
                  onSelect={handleVariantSelect}
                />
              </>
            )}

            {!hasChoice && (
              <p className="text-xs text-muted-foreground">
                Values per 100g — check and correct if needed:
              </p>
            )}

            <ScanResultFields
              values={editedValues}
              onChange={handleFieldChange}
              variant={hasChoice ? selectedVariant : "per_100g"}
            />

            <div className="flex gap-2">
              <Button onClick={handleApply} disabled={!canApply} className="flex-1">
                Apply to calculator
              </Button>
              <Button variant="outline" onClick={handleClose}>
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
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
