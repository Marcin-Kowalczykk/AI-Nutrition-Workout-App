"use client";

import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";

//libs
import {
  useDndContext,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface SortableProductRowProps {
  sortableId: string;
  mealIndex: number;
  productIndex: number;
  withTopRule: boolean;
  isViewMode: boolean;
  children: ReactNode;
}

export const SortableProductRow = ({
  sortableId,
  mealIndex,
  productIndex,
  withTopRule,
  isViewMode,
  children,
}: SortableProductRowProps) => {
  const { active } = useDndContext();
  const isDraggingMeal = active?.data?.current?.type === "meal";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { type: "product", mealIndex, productIndex },
    disabled: isDraggingMeal,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-1.5 items-start",
        withTopRule && "border-t border-border pt-2"
      )}
      {...(isViewMode ? listeners : {})}
      {...(isViewMode ? attributes : {})}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 touch-none cursor-grab active:cursor-grabbing rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Hold and drag to move product or reorder"
        {...(!isViewMode ? listeners : {})}
        {...(!isViewMode ? attributes : {})}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1 border-l-2 border-primary-element pl-3">
        {children}
      </div>
    </div>
  );
};

interface MealProductsDropEndProps {
  mealFieldId: string;
  mealIndex: number;
  variant?: "list" | "collapsed";
}

export const MealProductsDropEnd = ({
  mealFieldId,
  mealIndex,
  variant = "list",
}: MealProductsDropEndProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `meal-drop-end-${mealFieldId}`,
    data: { type: "drop-end", mealIndex },
  });

  return (
    <div
      ref={setNodeRef}
      aria-label={
        variant === "collapsed"
          ? "Drop zone — add product to this meal while collapsed"
          : undefined
      }
      className={cn(
        "rounded-md transition-colors",
        variant !== "collapsed" && "min-h-7",
        isOver && "bg-primary-element/10 ring-1 ring-primary-element/35"
      )}
    />
  );
};
