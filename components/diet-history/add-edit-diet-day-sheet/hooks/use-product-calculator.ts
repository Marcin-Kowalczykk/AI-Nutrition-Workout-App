"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

//types
import type { DietDayFormValues } from "@/components/diet-history/types";

interface UseProductCalculatorProps {
  mealIndex: number;
  productIndex: number;
}

export const useProductCalculator = ({
  mealIndex,
  productIndex,
}: UseProductCalculatorProps) => {
  const { setValue, getValues } = useFormContext<DietDayFormValues>();

  const [calcOpen, setCalcOpen] = useState(false);
  const [clearCalcConfirmOpen, setClearCalcConfirmOpen] = useState(false);

  const hasCalcData = () => {
    const vals = getValues(`meals.${mealIndex}.products.${productIndex}`);
    return !!(
      vals.weight_grams ||
      vals.kcal_per_100g ||
      vals.protein_per_100g ||
      vals.carbs_per_100g ||
      vals.fat_per_100g
    );
  };

  const recalculate = () => {
    const g = parseFloat(
      getValues(`meals.${mealIndex}.products.${productIndex}.weight_grams`) || ""
    );
    if (!g || g <= 0) return;
    const factor = g / 100;

    const kcal = parseFloat(
      getValues(`meals.${mealIndex}.products.${productIndex}.kcal_per_100g`) || ""
    );
    const protein = parseFloat(
      getValues(`meals.${mealIndex}.products.${productIndex}.protein_per_100g`) || ""
    );
    const carbs = parseFloat(
      getValues(`meals.${mealIndex}.products.${productIndex}.carbs_per_100g`) || ""
    );
    const fat = parseFloat(
      getValues(`meals.${mealIndex}.products.${productIndex}.fat_per_100g`) || ""
    );

    if (!isNaN(kcal))
      setValue(
        `meals.${mealIndex}.products.${productIndex}.product_kcal`,
        String((kcal * factor).toFixed(2)),
        { shouldDirty: true }
      );
    if (!isNaN(protein))
      setValue(
        `meals.${mealIndex}.products.${productIndex}.protein_value`,
        String((protein * factor).toFixed(2)),
        { shouldDirty: true }
      );
    if (!isNaN(carbs))
      setValue(
        `meals.${mealIndex}.products.${productIndex}.carbs_value`,
        String((carbs * factor).toFixed(2)),
        { shouldDirty: true }
      );
    if (!isNaN(fat))
      setValue(
        `meals.${mealIndex}.products.${productIndex}.fat_value`,
        String((fat * factor).toFixed(2)),
        { shouldDirty: true }
      );
  };

  const handleClearCalcConfirm = () => {
    (
      [
        "weight_grams",
        "kcal_per_100g",
        "protein_per_100g",
        "carbs_per_100g",
        "fat_per_100g",
      ] as const
    ).forEach((f) => {
      setValue(`meals.${mealIndex}.products.${productIndex}.${f}`, "", {
        shouldDirty: true,
      });
    });
    setCalcOpen(false);
    setClearCalcConfirmOpen(false);
  };

  const handleMainInputFocus = () => {
    if (hasCalcData()) {
      setClearCalcConfirmOpen(true);
    }
  };

  return {
    calcOpen,
    setCalcOpen,
    clearCalcConfirmOpen,
    setClearCalcConfirmOpen,
    hasCalcData,
    recalculate,
    handleClearCalcConfirm,
    handleMainInputFocus,
  };
};
