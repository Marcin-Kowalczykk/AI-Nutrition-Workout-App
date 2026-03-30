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
    })),
  })),
});
