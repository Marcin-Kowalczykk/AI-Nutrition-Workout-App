"use client";

import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

//types
import type { DietProductFormValues, DietDayFormValues } from "@/components/diet-history/types";

interface UseProductEditModeProps {
  mealIndex: number;
  productIndex: number;
  onRemove: () => void;
  onSave: () => void;
  isEditing: boolean;
  setCalcOpen: (open: boolean) => void;
}

export const useProductEditMode = ({
  mealIndex,
  productIndex,
  onRemove,
  onSave,
  isEditing,
  setCalcOpen,
}: UseProductEditModeProps) => {
  const {
    setValue,
    getValues,
    formState: { isDirty },
    trigger,
  } = useFormContext<DietDayFormValues>();

  const snapshotRef = useRef<DietProductFormValues | null>(null);

  const [mode, setMode] = useState<"view" | "edit">(() => {
    const name = getValues(
      `meals.${mealIndex}.products.${productIndex}.product_name`
    );
    return name ? "view" : "edit";
  });

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const enterEdit = () => {
    snapshotRef.current = getValues(
      `meals.${mealIndex}.products.${productIndex}`
    );
    const snap = snapshotRef.current;
    if (snap && (snap.weight_grams || snap.kcal_per_100g || snap.protein_per_100g)) {
      setCalcOpen(true);
    }
    setMode("edit");
  };

  const cancelEdit = () => {
    if (snapshotRef.current) {
      const snap = snapshotRef.current;
      (
        [
          "product_name",
          "product_kcal",
          "protein_value",
          "carbs_value",
          "fat_value",
          "weight_grams",
          "kcal_per_100g",
          "protein_per_100g",
          "carbs_per_100g",
          "fat_per_100g",
        ] as const
      ).forEach((f) => {
        setValue(
          `meals.${mealIndex}.products.${productIndex}.${f}`,
          snap[f] ?? "",
          { shouldDirty: true }
        );
      });
      setValue(
        `meals.${mealIndex}.products.${productIndex}.ai_breakdown`,
        snap.ai_breakdown ?? null,
        { shouldDirty: true }
      );
    }
    setCalcOpen(false);
    const name = getValues(
      `meals.${mealIndex}.products.${productIndex}.product_name`
    );
    if (!name) {
      onRemove();
      return;
    }
    setMode("view");
  };

  const saveEdit = async () => {
    const isValid = await trigger([
      `meals.${mealIndex}.products.${productIndex}.product_name`,
      `meals.${mealIndex}.products.${productIndex}.product_kcal`,
      `meals.${mealIndex}.products.${productIndex}.protein_value`,
      `meals.${mealIndex}.products.${productIndex}.carbs_value`,
      `meals.${mealIndex}.products.${productIndex}.fat_value`,
    ]);
    if (!isValid) return;
    setMode("view");
    if (isDirty) onSave();
  };

  const handleRemoveClick = () => {
    const name = getValues(
      `meals.${mealIndex}.products.${productIndex}.product_name`
    );
    const kcal = getValues(
      `meals.${mealIndex}.products.${productIndex}.product_kcal`
    );
    if (name || kcal) {
      setRemoveConfirmOpen(true);
    } else {
      onRemove();
    }
  };

  return {
    mode,
    snapshotRef,
    removeConfirmOpen,
    setRemoveConfirmOpen,
    enterEdit,
    cancelEdit,
    saveEdit,
    handleRemoveClick,
    isEditing,
    onRemove,
    onSave,
  };
};
