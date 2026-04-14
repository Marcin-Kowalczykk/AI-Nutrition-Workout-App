import { z } from "zod";

//types
import { breakdownItemSchema } from "@/components/shared/diet/types";
export type { BreakdownItem } from "@/components/shared/diet/types";

const nonNegativeNumberString = z
  .string()
  .min(1, "Required")
  .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
    message: "Must be a non-negative number",
  });

export { breakdownItemSchema };

export const dietProductSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  product_kcal: nonNegativeNumberString,
  protein_value: nonNegativeNumberString,
  carbs_value: nonNegativeNumberString,
  fat_value: nonNegativeNumberString,
  weight_grams: z.string().optional(),
  kcal_per_100g: z.string().optional(),
  protein_per_100g: z.string().optional(),
  carbs_per_100g: z.string().optional(),
  fat_per_100g: z.string().optional(),
  ai_breakdown: z.array(breakdownItemSchema).nullish(),
});

export const dietMealSchema = z.object({
  products: z.array(dietProductSchema).min(1, "Add at least one product"),
});

export const dietDayFormSchema = z.object({
  date: z.date({ error: "Date is required" }),
  meals: z.array(dietMealSchema).min(1, "Add at least one meal"),
});

export type DietProductFormValues = z.infer<typeof dietProductSchema>;
export type DietMealFormValues = z.infer<typeof dietMealSchema>;
export type DietDayFormValues = z.infer<typeof dietDayFormSchema>;

export const DEFAULT_PRODUCT: DietProductFormValues = {
  product_name: "",
  product_kcal: "",
  protein_value: "",
  carbs_value: "",
  fat_value: "",
  weight_grams: "",
  kcal_per_100g: "",
  protein_per_100g: "",
  carbs_per_100g: "",
  fat_per_100g: "",
  ai_breakdown: null,
};

export const DEFAULT_MEAL: DietMealFormValues = {
  products: [{ ...DEFAULT_PRODUCT }],
};
