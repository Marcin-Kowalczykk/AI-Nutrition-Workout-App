"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";

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

export const DietDayCard = ({
  day,
  onEdit,
  onDelete,
  isDeleting,
}: DietDayCardProps) => {
  const formattedDate = format(
    new Date(day.date + "T00:00:00"),
    "d MMMM yyyy",
    { locale: pl }
  );

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
          <div className="flex items-center gap-1 shrink-0">
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
            <p className="text-xs text-muted-foreground font-medium">Meal {meal.meal_number}</p>
            {meal.diet_products.map((product) => (
              <div key={product.id} className="flex items-baseline justify-between gap-1 pl-2">
                <p className="text-xs text-foreground truncate">{product.product_name}</p>
                <p className="text-xs text-muted-foreground shrink-0">
                  {product.weight_grams != null ? `~${Math.round(product.weight_grams)}g · ` : ""}
                  {Math.round(product.product_kcal)} kcal · P: {product.protein_value.toFixed(1)}g · C: {product.carbs_value.toFixed(1)}g · F: {product.fat_value.toFixed(1)}g
                </p>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
