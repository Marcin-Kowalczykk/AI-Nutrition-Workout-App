export type IDietProduct = {
  id: string;
  diet_meal_id: string;
  product_name: string;
  product_kcal: number;
  protein_value: number;
  carbs_value: number;
  fat_value: number;
  weight_grams: number | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  created_at: string;
};

export type IDietMeal = {
  id: string;
  diet_day_id: string;
  meal_number: number;
  created_at: string;
  diet_products: IDietProduct[];
  total_kcal: number;
};

export type IDietDay = {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  updated_at: string;
  diet_meals: IDietMeal[];
  total_kcal: number;
  total_protein_value: number;
  total_carbs_value: number;
  total_fat_value: number;
};
