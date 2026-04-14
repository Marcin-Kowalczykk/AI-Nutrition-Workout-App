"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type Control } from "react-hook-form";

//libs
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

//types
import type { DietDayFormValues } from "@/components/diet-history/types";
import { DEFAULT_PRODUCT } from "@/components/diet-history/types";

//components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { MacroBadge } from "@/components/shared/macro-badge";
import { ProductFields } from "./product-fields";
import { SortableProductRow, MealProductsDropEnd } from "./sortable-product-row";

const fmtNum = (v: number) => parseFloat(v.toFixed(1)).toString();

interface MealSectionProps {
  mealIndex: number;
  mealFieldId: string;
  totalMeals: number;
  control: Control<DietDayFormValues>;
  onRemoveMeal: () => void;
  onSave: () => void;
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  isEditing: boolean;
}

export const MealSection = ({
  mealIndex,
  mealFieldId,
  totalMeals,
  control,
  onRemoveMeal,
  onSave,
  expanded,
  onExpandedChange,
  isEditing,
}: MealSectionProps) => {
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({ control, name: `meals.${mealIndex}.products` });

  const {
    attributes: mealSortAttributes,
    listeners: mealSortListeners,
    setNodeRef: setMealSortRef,
    transform: mealTransform,
    isDragging: mealDragging,
  } = useDraggable({
    id: mealFieldId,
    data: { type: "meal", mealIndex },
  });

  const { setNodeRef: setMergeRef, isOver: mergeOver } = useDroppable({
    id: `meal-merge-${mealFieldId}`,
    data: { type: "meal-merge", mealIndex },
  });

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const isCollapsed = !expanded;
  const mealProducts = useWatch({ control, name: `meals.${mealIndex}.products` });
  const mealTotals = useMemo(
    () =>
      (mealProducts ?? []).reduce(
        (acc, p) => ({
          kcal: acc.kcal + (parseFloat(p.product_kcal) || 0),
          protein: acc.protein + (parseFloat(p.protein_value) || 0),
          carbs: acc.carbs + (parseFloat(p.carbs_value) || 0),
          fat: acc.fat + (parseFloat(p.fat_value) || 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [mealProducts]
  );

  const handleRemoveMealClick = () => {
    const hasFilled = mealProducts.some((p) => p.product_name || p.product_kcal);
    if (hasFilled) {
      setRemoveConfirmOpen(true);
    } else {
      onRemoveMeal();
    }
  };

  const mealCardStyle = {
    transform: CSS.Transform.toString(mealTransform),
    opacity: mealDragging ? 0.4 : undefined,
  };

  const productSortableIds = useMemo(
    () => productFields.map((f) => f.id),
    [productFields]
  );

  return (
    <Card ref={setMealSortRef} style={mealCardStyle} className="border-0 shadow-none">
      <CardContent className="p-3 flex flex-col gap-2">
        <ConfirmModal
          open={removeConfirmOpen}
          onOpenChange={setRemoveConfirmOpen}
          title="Remove meal?"
          description="This meal has data. Are you sure you want to remove it?"
          confirmLabel="Remove"
          confirmVariant="destructive"
          onConfirm={() => { setRemoveConfirmOpen(false); onRemoveMeal(); }}
        />
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="touch-none cursor-grab active:cursor-grabbing rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
              aria-label="Hold and drag to reorder or merge meals"
              {...mealSortListeners}
              {...mealSortAttributes}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
          <div
            ref={setMergeRef}
            role="button"
            tabIndex={0}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none",
              mergeOver && "bg-primary-element/15 ring-1 ring-primary-element/40"
            )}
            onClick={() => onExpandedChange(!expanded)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onExpandedChange(!expanded);
              }
            }}
          >
            <div className="flex min-w-0 flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-tight">Meal {mealIndex + 1}</p>
                {mealTotals.kcal > 0 && (
                  <MacroBadge macro="kcal" value={Math.round(mealTotals.kcal)} />
                )}
              </div>
              {mealTotals.kcal > 0 && (
                <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs tabular-nums">
                  <MacroBadge macro="protein" value={fmtNum(mealTotals.protein)} />
                  <MacroBadge macro="carbs" value={fmtNum(mealTotals.carbs)} />
                  <MacroBadge macro="fat" value={fmtNum(mealTotals.fat)} />
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => onExpandedChange(!expanded)}
              aria-expanded={expanded}
              aria-label={isCollapsed ? "Expand meal" : "Collapse meal"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
            {totalMeals > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveMealClick}
                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                aria-label={`Remove meal ${mealIndex + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isCollapsed ? (
          <MealProductsDropEnd
            mealFieldId={mealFieldId}
            mealIndex={mealIndex}
            variant="collapsed"
          />
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <SortableContext
                items={productSortableIds}
                strategy={verticalListSortingStrategy}
              >
                {productFields.map((productField, productIndex) => (
                  <SortableProductRow
                    key={productField.id}
                    sortableId={productField.id}
                    mealIndex={mealIndex}
                    productIndex={productIndex}
                    withTopRule={productIndex > 0}
                    isViewMode={!!mealProducts[productIndex]?.product_name}
                  >
                    <ProductFields
                      mealIndex={mealIndex}
                      productIndex={productIndex}
                      control={control}
                      onRemove={() => removeProduct(productIndex)}
                      onSave={onSave}
                      appendProduct={appendProduct}
                      isEditing={isEditing}
                    />
                  </SortableProductRow>
                ))}
              </SortableContext>
              <MealProductsDropEnd mealFieldId={mealFieldId} mealIndex={mealIndex} />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendProduct({ ...DEFAULT_PRODUCT })}
              className="w-full h-7 text-xs mt-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add product
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
