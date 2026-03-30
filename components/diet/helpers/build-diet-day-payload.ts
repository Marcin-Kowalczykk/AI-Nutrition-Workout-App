//types
import type { DietDayFormValues } from "../types";
import type { ICreateDietDayRequestBody } from "@/app/api/diet/create/route";

export const buildDietDayPayload = (
  values: DietDayFormValues
): ICreateDietDayRequestBody => ({
  date: values.date.toISOString().split("T")[0],
  meals: values.meals.map((meal) => ({
    products: meal.products.map((p) => ({
      product_name: p.product_name,
      product_kcal: Number(p.product_kcal),
      protein_value: Number(p.protein_value),
      carbs_value: Number(p.carbs_value),
      fat_value: Number(p.fat_value),
      weight_grams: p.weight_grams ? Number(p.weight_grams) : null,
      kcal_per_100g: p.kcal_per_100g ? Number(p.kcal_per_100g) : null,
      protein_per_100g: p.protein_per_100g ? Number(p.protein_per_100g) : null,
      carbs_per_100g: p.carbs_per_100g ? Number(p.carbs_per_100g) : null,
      fat_per_100g: p.fat_per_100g ? Number(p.fat_per_100g) : null,
    })),
  })),
});
