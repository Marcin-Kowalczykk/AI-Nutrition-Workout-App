"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

//libs
import { cn } from "@/lib/utils";
import { toast } from "sonner";

//hooks
import { getAccessToken } from "@/lib/supabase/get-access-token";

//types
import type { BreakdownItem } from "@/components/diet-history/types";

//components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";

type AnalyzeState =
  | "idle"
  | "photo_preview"
  | "analyzing"
  | "result"
  | "error"
  | "limit_reached";

export interface ProductAnalysis {
  product_name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  weight_grams: string;
  breakdown: BreakdownItem[] | null;
}

interface AiMealAnalyzerProps {
  productName: string;
  onApply: (products: ProductAnalysis[]) => void;
  onClose?: () => void;
  ctaLabel?: string;
  ctaLabelMulti?: string;
  ctaVariant?: "default" | "gradient";
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

export const AiMealAnalyzer = ({
  productName,
  onApply,
  onClose,
  ctaLabel = "Apply",
  ctaLabelMulti,
  ctaVariant = "default",
}: AiMealAnalyzerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productNameTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>("idle");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [analyzedProducts, setAnalyzedProducts] = useState<ProductAnalysis[]>([]);
  const [editedProduct, setEditedProduct] = useState<ProductAnalysis | null>(null);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<number>>(new Set());
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNameExpanded, setIsNameExpanded] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<ProductAnalysis | null>(null);

  const nameRef = useRef<HTMLSpanElement>(null);
  const [isNameTruncated, setIsNameTruncated] = useState(false);

  useEffect(() => {
    if (isNameExpanded) return;
    const el = nameRef.current;
    if (!el) return;
    setIsNameTruncated(el.scrollHeight > el.clientHeight);
  }, [productName, isNameExpanded]);

  useEffect(() => {
    if (analyzeState === "result" && productNameTextareaRef.current) {
      const el = productNameTextareaRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [analyzeState]);

  const reset = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAnalyzeState("idle");
    setPreviewUrls([]);
    setPhotos([]);
    setAnalyzedProducts([]);
    setEditedProduct(null);
    setExpandedBreakdowns(new Set());
    setConfidence(null);
    setWarning(null);
    setError(null);
    setIsNameExpanded(false);
    setEditingIndex(null);
    setEditingDraft(null);
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
      const products: ProductAnalysis[] = (data.products ?? []).map((p: {
        product_name: string;
        kcal: number | null;
        protein: number | null;
        carbs: number | null;
        fat: number | null;
        breakdown: BreakdownItem[] | null;
      }) => ({
        product_name: p.product_name ?? "",
        kcal: p.kcal != null ? String(p.kcal) : "",
        protein: p.protein != null ? String(p.protein) : "",
        carbs: p.carbs != null ? String(p.carbs) : "",
        fat: p.fat != null ? String(p.fat) : "",
        weight_grams: p.breakdown && p.breakdown.length > 0
          ? String(p.breakdown.reduce((sum: number, item: BreakdownItem) => sum + item.weight_g, 0))
          : "",
        breakdown: p.breakdown ?? null,
      }));

      setAnalyzedProducts(products);
      setEditedProduct(products.length === 1 ? { ...products[0] } : null);
      setConfidence(data.confidence ?? null);
      setWarning(data.warning ?? null);
      setAnalyzeState("result");
    } catch {
      toast.error("Analysis failed, try again.");
      setAnalyzeState(photoFiles.length > 0 ? "photo_preview" : "idle");
    }
  };

  const toggleBreakdown = (index: number) => {
    setExpandedBreakdowns((prev) => {
      const next = new Set(prev);
      if (next.has(index)) { next.delete(index); } else { next.add(index); }
      return next;
    });
  };

  const handleDeleteProduct = (index: number) => {
    const next = analyzedProducts.filter((_, i) => i !== index);
    setAnalyzedProducts(next);
    if (next.length === 1) {
      setEditedProduct({ ...next[0] });
    }
    setEditingIndex(null);
    setEditingDraft(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingDraft({ ...analyzedProducts[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingDraft) return;
    setAnalyzedProducts((prev) =>
      prev.map((p, i) => (i === editingIndex ? editingDraft : p))
    );
    setEditingIndex(null);
    setEditingDraft(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingDraft(null);
  };

  const handleApply = () => {
    if (analyzedProducts.length === 1 && editedProduct) {
      onApply([editedProduct]);
    } else {
      onApply(analyzedProducts);
    }
    reset();
    onClose?.();
  };

  const ctaText =
    analyzedProducts.length > 1
      ? ctaLabelMulti
        ? ctaLabelMulti.replace("{N}", String(analyzedProducts.length))
        : `Apply ${analyzedProducts.length} products`
      : ctaLabel;

  const totalItems = [
    { key: "kcal", label: "kcal", value: String(Math.round(analyzedProducts.reduce((s, p) => s + (parseFloat(p.kcal) || 0), 0))) },
    { key: "protein", label: "białko", value: `${Math.round(analyzedProducts.reduce((s, p) => s + (parseFloat(p.protein) || 0), 0))}g` },
    { key: "carbs", label: "węgle", value: `${Math.round(analyzedProducts.reduce((s, p) => s + (parseFloat(p.carbs) || 0), 0))}g` },
    { key: "fat", label: "tłuszcz", value: `${Math.round(analyzedProducts.reduce((s, p) => s + (parseFloat(p.fat) || 0), 0))}g` },
  ];

  return (
    <div className="flex flex-col gap-3">
      {productName && (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Analysing:</span>
            <span
              ref={nameRef}
              className={cn(
                "font-medium text-foreground",
                !isNameExpanded && "line-clamp-2"
              )}
            >
              {productName}
            </span>
          </div>
          {isNameTruncated && (
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
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
          {/* Confidence badge — above macro tiles */}
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

          {warning && (
            <div className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {warning}
            </div>
          )}

          {/* Single product */}
          {analyzedProducts.length === 1 && editedProduct && (
            <div className="flex flex-col gap-3">
              {/* Macro tiles */}
              <div className="grid grid-cols-4 gap-2">
                {(["kcal", "protein", "carbs", "fat"] as const).map((key) => (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg p-2.5 text-center",
                      key === "kcal"
                        ? "bg-primary-element/10 border border-primary-element/30"
                        : "bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "text-xl font-extrabold leading-tight",
                      key === "kcal" && "text-primary-element"
                    )}>
                      {editedProduct[key] || "—"}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground mt-1">
                      {key === "kcal" ? "kcal" : key === "protein" ? "białko" : key === "carbs" ? "węgle" : "tłuszcz"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Editable product name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="analyze-product-name" className="text-xs font-medium">
                  Product name
                </label>
                <textarea
                  id="analyze-product-name"
                  ref={productNameTextareaRef}
                  value={editedProduct.product_name}
                  rows={1}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-base md:text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  onChange={(e) => {
                    setEditedProduct((p) => p ? { ...p, product_name: e.target.value } : p);
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }}
                />
              </div>

              {editedProduct.weight_grams && (
                <p className="text-xs text-muted-foreground">{editedProduct.weight_grams}g</p>
              )}
              <p className="text-xs text-muted-foreground">Check and correct if needed:</p>
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
                      value={editedProduct[key]}
                      onChange={(e) =>
                        setEditedProduct((p) => p ? { ...p, [key]: e.target.value } : p)
                      }
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
              {editedProduct.breakdown && editedProduct.breakdown.length > 1 && (
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => toggleBreakdown(0)}
                  >
                    {expandedBreakdowns.has(0) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    Meal components ({editedProduct.breakdown.length})
                  </button>
                  {expandedBreakdowns.has(0) && (
                    <div className="mt-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 flex flex-col gap-1">
                      {editedProduct.breakdown.map((item, i) => (
                        <div key={i} className="flex flex-col gap-0.5 text-xs">
                          <span className="text-foreground">• {item.name}</span>
                          <span className="text-muted-foreground pl-3">
                            {item.weight_g}g · {item.kcal} kcal
                            {(item.protein != null || item.carbs != null || item.fat != null) && (
                              <> · P: {item.protein ?? 0}g · C: {item.carbs ?? 0}g · F: {item.fat ?? 0}g</>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Multi product */}
          {analyzedProducts.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Found {analyzedProducts.length} products:</p>
              {analyzedProducts.map((product, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/40 px-3 py-3 flex flex-col gap-2">
                  {editingIndex === i && editingDraft ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium">Product name</label>
                        <textarea
                          value={editingDraft.product_name}
                          rows={1}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          onChange={(e) => {
                            setEditingDraft((d) => d ? { ...d, product_name: e.target.value } : d);
                            const el = e.currentTarget;
                            el.style.height = "auto";
                            el.style.height = `${el.scrollHeight}px`;
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(["kcal", "protein", "carbs", "fat"] as const).map((key) => (
                          <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-medium">
                              {key === "kcal" ? "Kcal" : `${key.charAt(0).toUpperCase() + key.slice(1)} [g]`}
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={editingDraft[key]}
                              onChange={(e) => setEditingDraft((d) => d ? { ...d, [key]: e.target.value } : d)}
                              className="h-7 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium">{product.product_name}</span>
                          {product.weight_grams && (
                            <span className="text-xs text-muted-foreground ml-1.5">{product.weight_grams}g</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(i)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Edit product ${i + 1}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(i)}
                            className="text-destructive hover:text-destructive/80"
                            aria-label={`Delete product ${i + 1}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(["kcal", "protein", "carbs", "fat"] as const).map((key) => (
                          <div
                            key={key}
                            className={cn(
                              "rounded-md p-1.5 text-center",
                              key === "kcal"
                                ? "bg-primary-element/10 border border-primary-element/30"
                                : "bg-background"
                            )}
                          >
                            <div className={cn(
                              "text-sm font-bold leading-tight",
                              key === "kcal" && "text-primary-element"
                            )}>
                              {product[key]}{key !== "kcal" && <span className="text-[9px] font-normal">g</span>}
                            </div>
                            <div className="text-[8px] uppercase tracking-wide text-muted-foreground">
                              {key === "kcal" ? "kcal" : key === "protein" ? "białko" : key === "carbs" ? "węgle" : "tłuszcz"}
                            </div>
                          </div>
                        ))}
                      </div>
                      {product.breakdown && product.breakdown.length > 1 && (
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
                            onClick={() => toggleBreakdown(i)}
                          >
                            {expandedBreakdowns.has(i) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            Components ({product.breakdown.length})
                          </button>
                          {expandedBreakdowns.has(i) && (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {product.breakdown.map((item, j) => (
                                <div key={j} className="flex flex-col gap-0.5 text-xs">
                                  <span className="text-foreground">• {item.name}</span>
                                  <span className="text-muted-foreground pl-3">
                                    {item.weight_g}g · {item.kcal} kcal
                                    {(item.protein != null || item.carbs != null || item.fat != null) && (
                                      <> · P: {item.protein ?? 0}g · C: {item.carbs ?? 0}g · F: {item.fat ?? 0}g</>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div className="rounded-lg border border-primary-element/30 bg-primary-element/5 p-3">
                <p className="text-[10px] font-bold text-primary-element uppercase tracking-wider mb-2">Total</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {totalItems.map(({ key, label, value }) => (
                    <div key={key} className="text-center">
                      <div className={cn(
                        "text-lg font-extrabold leading-tight",
                        key === "kcal" && "text-primary-element"
                      )}>
                        {value}
                      </div>
                      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2">
            <Button variant={ctaVariant} onClick={handleApply} className="flex-1">
              {ctaText}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
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
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
