"use client";

//components
import { Input } from "@/components/ui/input";

//types
import type { ScanResult, ScanVariant } from "./scan-product.types";

interface ScanResultFieldsProps {
  values: ScanResult;
  onChange: (key: keyof Omit<ScanResult, "grams">, value: string) => void;
  variant: ScanVariant | null;
}

type FieldKey = "kcal" | "protein" | "carbs" | "fat";

const PER_100G_LABELS: Record<FieldKey, string> = {
  kcal: "Kcal / 100g",
  protein: "Protein / 100g",
  carbs: "Carbs / 100g",
  fat: "Fat / 100g",
};

const TOTAL_LABELS: Record<FieldKey, string> = {
  kcal: "Kcal total",
  protein: "Protein total",
  carbs: "Carbs total",
  fat: "Fat total",
};

const FIELDS: FieldKey[] = ["kcal", "protein", "carbs", "fat"];

export const ScanResultFields = ({ values, onChange, variant }: ScanResultFieldsProps) => {
  const disabled = variant === null;
  const labels = variant === "whole_product" ? TOTAL_LABELS : PER_100G_LABELS; // null falls back to per-100g as placeholder

  return (
    <div className="grid grid-cols-2 gap-2">
      {FIELDS.map((key) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">
            {labels[key]}
          </label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={values[key]}
            disabled={disabled}
            onChange={(e) => onChange(key, e.target.value)}
            className="h-8 text-sm"
            placeholder="—"
          />
        </div>
      ))}
    </div>
  );
};
