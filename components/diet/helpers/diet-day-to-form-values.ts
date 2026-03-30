//types
import type { IDietDay } from "@/app/api/diet/types";
import type { DietDayFormValues } from "../types";

export const dietDayToFormValues = (day: IDietDay): DietDayFormValues => ({
  date: new Date(day.date + "T00:00:00"),
  meals: day.diet_meals
    .sort((a, b) => a.meal_number - b.meal_number)
    .map((meal) => ({
      products: meal.diet_products.map((p) => ({
        product_name: p.product_name,
        product_kcal: String(p.product_kcal),
        protein_value: String(p.protein_value),
        carbs_value: String(p.carbs_value),
        fat_value: String(p.fat_value),
      })),
    })),
});
