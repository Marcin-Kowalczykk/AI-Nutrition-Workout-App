"use client";

import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";

//types
import type { DietDayFormValues } from "@/components/diet-history/types";

//components
import { MacroBadge } from "@/components/shared/macro-badge";

const fmtNum = (v: number) => parseFloat(v.toFixed(1)).toString();

interface DaySummaryProps {
  control: Control<DietDayFormValues>;
}

export const DaySummary = ({ control }: DaySummaryProps) => {
  const meals = useWatch({ control, name: "meals" });
  const totals = useMemo(
    () =>
      (meals ?? [])
        .flatMap((m) => m.products)
        .reduce(
          (acc, p) => ({
            kcal: acc.kcal + (parseFloat(p.product_kcal) || 0),
            protein: acc.protein + (parseFloat(p.protein_value) || 0),
            carbs: acc.carbs + (parseFloat(p.carbs_value) || 0),
            fat: acc.fat + (parseFloat(p.fat_value) || 0),
          }),
          { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        ),
    [meals]
  );

  return (
    <div className="border rounded-md px-3 py-2 bg-muted/30 flex items-center gap-2 flex-wrap">
      <MacroBadge macro="kcal" value={Math.round(totals.kcal)} className="text-[13px] px-2 py-1" />
      <MacroBadge macro="protein" value={fmtNum(totals.protein)} />
      <MacroBadge macro="carbs" value={fmtNum(totals.carbs)} />
      <MacroBadge macro="fat" value={fmtNum(totals.fat)} />
    </div>
  );
};
