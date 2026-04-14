import { z } from "zod";

export const breakdownItemSchema = z.object({
  name: z.string(),
  weight_g: z.number(),
  kcal: z.number(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
});

export type BreakdownItem = z.infer<typeof breakdownItemSchema>;

export interface ProductAnalysis {
  product_name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  weight_grams: string;
  breakdown: BreakdownItem[] | null;
}
