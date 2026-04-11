"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronDown, Copy, Edit, Trash2 } from "lucide-react";

//components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";
import { CopyMealDialog } from "./copy-meal-dialog";
import { CopyProductDialog } from "./copy-product-dialog";

//types
import type { IDietDay, IDietMeal, IDietProduct } from "@/app/api/diet/types";

interface DietDayCardProps {
  day: IDietDay;
  onEdit: (day: IDietDay) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const fmtNum = (v: number) => parseFloat(v.toFixed(1)).toString();

const getMealSummary = (meal: IDietMeal) => {
  const kcal = Math.round(
    meal.diet_products.reduce((s, p) => s + p.product_kcal, 0)
  );
  const protein = fmtNum(
    meal.diet_products.reduce((s, p) => s + p.protein_value, 0)
  );
  const carbs = fmtNum(
    meal.diet_products.reduce((s, p) => s + p.carbs_value, 0)
  );
  const fat = fmtNum(meal.diet_products.reduce((s, p) => s + p.fat_value, 0));
  return { kcal, protein, carbs, fat };
};

export const DietDayCard = ({
  day,
  onEdit,
  onDelete,
  isDeleting,
}: DietDayCardProps) => {
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [mealToCopy, setMealToCopy] = useState<IDietMeal | null>(null);
  const [productToCopy, setProductToCopy] = useState<IDietProduct | null>(null);

  const date = new Date(day.date + "T00:00:00");
  const formattedDate = format(date, "d MMMM yyyy", { locale: pl });
  const weekday = format(date, "EEE");

  const toggleMeal = (id: string) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <Card
        className={`w-full${
          isDeleting ? " opacity-50 pointer-events-none" : ""
        }`}
      >
        <CardContent className="p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold border-b-2 border-primary-element pb-1 w-fit">
              {formattedDate}
              <span className="text-xs text-primary-element font-medium ml-1.5">
                {weekday}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(day)}
                className="h-8 w-8"
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

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black leading-none">
              {Math.round(day.total_kcal).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground font-medium">
              kcal
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-muted/40 rounded-lg px-2 py-1.5 border border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Protein
              </p>
              <p className="text-sm font-extrabold text-macro-protein">
                {Math.round(day.total_protein_value)}g
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg px-2 py-1.5 border border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Carbs
              </p>
              <p className="text-sm font-extrabold text-macro-carbs">
                {Math.round(day.total_carbs_value)}g
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg px-2 py-1.5 border border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Fat
              </p>
              <p className="text-sm font-extrabold text-macro-fat">
                {Math.round(day.total_fat_value)}g
              </p>
            </div>
          </div>

          {day.diet_meals.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Meals
              </p>
              {day.diet_meals.map((meal) => {
                const isExpanded = expandedMeals.has(meal.id);
                const summary = getMealSummary(meal);
                return (
                  <div
                    key={meal.id}
                    className="rounded-lg bg-muted/30 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-element shrink-0" />
                      <span className="text-xs font-bold text-foreground shrink-0">
                        Meal {meal.meal_number}
                      </span>
                      {isExpanded && meal.diet_products.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-muted-foreground/60 hover:text-foreground gap-1 px-1.5 shrink-0"
                          onClick={() => setMealToCopy(meal)}
                        >
                          <Copy className="h-2.5 w-2.5" />
                          Copy
                        </Button>
                      )}
                      <button
                        type="button"
                        className="flex flex-1 items-center justify-end gap-2 min-w-0"
                        onClick={() => toggleMeal(meal.id)}
                      >
                        <span className="text-[11px] text-muted-foreground">
                          {summary.kcal} kcal
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform duration-200${
                            isExpanded ? " rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border px-2.5 pt-2 pb-2.5 flex flex-col gap-2">
                        <div className="flex gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-macro-protein">
                              P
                            </span>
                            <span className="text-muted-foreground">
                              {summary.protein}g
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-macro-carbs">
                              C
                            </span>
                            <span className="text-muted-foreground">
                              {summary.carbs}g
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-macro-fat">F</span>
                            <span className="text-muted-foreground">
                              {summary.fat}g
                            </span>
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          {meal.diet_products.map((product) => (
                            <div
                              key={product.id}
                              className="pl-3 border-l-2 border-primary-element/20 py-1.5 flex gap-2 items-start"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-foreground">
                                  {product.product_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {product.weight_grams != null
                                    ? `${Math.round(product.weight_grams)}g · `
                                    : ""}
                                  {Math.round(product.product_kcal)} kcal · P:{" "}
                                  {fmtNum(product.protein_value)}g · C:{" "}
                                  {fmtNum(product.carbs_value)}g · F:{" "}
                                  {fmtNum(product.fat_value)}g
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-muted-foreground/60 hover:text-foreground gap-1 px-1.5 shrink-0"
                                onClick={() => setProductToCopy(product)}
                              >
                                <Copy className="h-2.5 w-2.5" />
                                Copy
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CopyMealDialog
        meal={mealToCopy}
        onOpenChange={(open) => !open && setMealToCopy(null)}
      />
      <CopyProductDialog
        product={productToCopy}
        onOpenChange={(open) => !open && setProductToCopy(null)}
      />
    </>
  );
};
