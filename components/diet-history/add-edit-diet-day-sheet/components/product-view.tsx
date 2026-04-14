"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";

//types
import type { DietDayFormValues } from "@/components/diet-history/types";

//components
import { Button } from "@/components/ui/button";
import { MacroBadge } from "@/components/shared/macro-badge";

interface ProductViewProps {
  mealIndex: number;
  productIndex: number;
  control: Control<DietDayFormValues>;
  onEdit: () => void;
  onRemove: () => void;
}

export const ProductView = ({
  mealIndex,
  productIndex,
  control,
  onEdit,
  onRemove,
}: ProductViewProps) => {
  const productName = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.product_name`,
  });
  const productKcal = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.product_kcal`,
  });
  const proteinValue = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.protein_value`,
  });
  const carbsValue = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.carbs_value`,
  });
  const fatValue = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.fat_value`,
  });
  const weightGrams = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.weight_grams`,
  });
  const aiBreakdown = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.ai_breakdown`,
  });

  const [breakdownOpen, setBreakdownOpen] = useState(false);

  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-medium truncate select-none">{productName}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap select-none">
          {weightGrams ? <span>{weightGrams}g ·</span> : null}
          <span>{productKcal} kcal</span>
          <MacroBadge macro="protein" value={proteinValue} variant="inline" />
          <MacroBadge macro="carbs" value={carbsValue} variant="inline" />
          <MacroBadge macro="fat" value={fatValue} variant="inline" />
        </p>
        {aiBreakdown && aiBreakdown.length > 1 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground mt-0.5"
              onClick={() => setBreakdownOpen((v) => !v)}
            >
              {breakdownOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Components ({aiBreakdown.length})
            </button>
            {breakdownOpen && (
              <div className="mt-1 flex flex-col gap-0.5">
                {aiBreakdown.map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5 text-xs select-none">
                    <span className="text-foreground/80">• {item.name}</span>
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
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-7 w-7"
          aria-label={`Edit product ${productIndex + 1}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {!!(productName || productKcal) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-7 w-7 text-destructive hover:text-destructive"
            aria-label={`Remove product ${productIndex + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
