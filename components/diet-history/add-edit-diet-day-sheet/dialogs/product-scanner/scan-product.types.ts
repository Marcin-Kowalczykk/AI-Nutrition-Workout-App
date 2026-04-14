export type ScanState =
  | "idle"
  | "preview"
  | "analyzing"
  | "result"
  | "error"
  | "limit_reached";

export type ScanVariant = "per_100g" | "whole_product";

export interface WholeProduct {
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Shape returned by the API route */
export interface ScanApiResponse {
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  whole_product: WholeProduct | null;
  /** Total/net product weight detected anywhere on the label (g) */
  total_grams: number | null;
}

/** Passed to onApply callback */
export interface ScanResult {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  /** Present when the user chose the whole-product variant (total values mode) */
  grams?: string;
  /** Pre-detected product weight to fill into the calculator grams field (per-100g mode) */
  prefilledGrams?: string;
}
