"use client";

import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";

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
    // Phase 2: implemented in Task 6
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
              Daily limit reached (5/5 scans). Try again tomorrow.
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
