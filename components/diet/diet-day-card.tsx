"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";

//components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";

//types
import type { IDietDay } from "@/app/api/diet/types";

interface DietDayCardProps {
  day: IDietDay;
  onEdit: (day: IDietDay) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const fmtNum = (v: number) => parseFloat(v.toFixed(1)).toString();

export const DietDayCard = ({
  day,
  onEdit,
  onDelete,
  isDeleting,
}: DietDayCardProps) => {
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(
    () => new Set(day.diet_meals.map((m) => m.id))
  );

  const formattedDate = format(
    new Date(day.date + "T00:00:00"),
    "d MMMM yyyy",
    { locale: pl }
  );

  const toggleMeal = (id: string) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <Card
      className={`w-full${
        isDeleting ? " opacity-50 pointer-events-none" : ""
      }`}
    >
      <CardContent className="p-2 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground border-b-2 border-primary-element pb-1 w-fit">
            {formattedDate}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(day)}
              className="h-8 w-8 text-foreground"
              aria-label="Edit diet day"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(day.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
              aria-label="Delete diet day"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader size={16} />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 text-xs">
          <span>
            <strong>Kcal:</strong> {Math.round(day.total_kcal)}
          </span>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <strong>Protein:</strong> {Math.round(day.total_protein_value)} g
            </span>
            <span>
              <strong>Carbs:</strong> {Math.round(day.total_carbs_value)} g
            </span>
            <span>
              <strong>Fat:</strong> {Math.round(day.total_fat_value)} g
            </span>
          </div>
        </div>
        {day.diet_meals.map((meal) => (
          <div key={meal.id} className="flex flex-col gap-0.5 mt-1">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-foreground"
              onClick={() => toggleMeal(meal.id)}
            >
              {expandedMeals.has(meal.id) ? (
                <ChevronUp className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0" />
              )}
              Meal {meal.meal_number}
            </button>
            {expandedMeals.has(meal.id) && meal.diet_products.map((product) => (
              <div key={product.id} className="flex items-baseline justify-between gap-1 pl-3">
                <p className="text-xs text-foreground truncate">{product.product_name}</p>
                <p className="text-xs text-muted-foreground shrink-0">
                  {product.weight_grams != null ? `~${Math.round(product.weight_grams)}g · ` : ""}
                  {Math.round(product.product_kcal)} kcal · P: {fmtNum(product.protein_value)}g · C: {fmtNum(product.carbs_value)}g · F: {fmtNum(product.fat_value)}g
                </p>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
