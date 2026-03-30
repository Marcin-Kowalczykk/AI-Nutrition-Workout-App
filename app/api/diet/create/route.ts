import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

//constants
import { TABLE_NAMES } from "@/app/api/tableNames";

//types
import type { IDietDay, IDietProduct } from "../types";

type ProductInput = {
  product_name: string;
  product_kcal: number;
  protein_value: number;
  carbs_value: number;
  fat_value: number;
  weight_grams?: number | null;
  kcal_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
};

type MealInput = {
  products: ProductInput[];
};

export type ICreateDietDayRequestBody = {
  date: string;
  meals: MealInput[];
};

export type ICreateDietDayResponse = IDietDay;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ICreateDietDayRequestBody = await request.json();

    if (!body.date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    if (!body.meals || body.meals.length === 0) {
      return NextResponse.json(
        { error: "At least one meal is required" },
        { status: 400 }
      );
    }

    const { data: day, error: dayError } = await supabase
      .from(TABLE_NAMES.DIET_DAYS)
      .insert({ user_id: user.id, date: body.date })
      .select()
      .single();

    if (dayError) {
      console.error("Error creating diet day:", dayError);
      return NextResponse.json({ error: dayError.message }, { status: 400 });
    }

    const mealsWithProducts = [];

    for (let i = 0; i < body.meals.length; i++) {
      const mealInput = body.meals[i];

      const { data: meal, error: mealError } = await supabase
        .from(TABLE_NAMES.DIET_MEALS)
        .insert({ diet_day_id: day.id, meal_number: i + 1 })
        .select()
        .single();

      if (mealError) {
        console.error("Error creating meal:", mealError);
        return NextResponse.json({ error: mealError.message }, { status: 400 });
      }

      let products: IDietProduct[] = [];

      if (mealInput.products.length > 0) {
        const { data: insertedProducts, error: productsError } = await supabase
          .from(TABLE_NAMES.DIET_PRODUCTS)
          .insert(
            mealInput.products.map((p) => ({
              diet_meal_id: meal.id,
              product_name: p.product_name,
              product_kcal: p.product_kcal,
              protein_value: p.protein_value,
              carbs_value: p.carbs_value,
              fat_value: p.fat_value,
              weight_grams: p.weight_grams ?? null,
              kcal_per_100g: p.kcal_per_100g ?? null,
              protein_per_100g: p.protein_per_100g ?? null,
              carbs_per_100g: p.carbs_per_100g ?? null,
              fat_per_100g: p.fat_per_100g ?? null,
            }))
          )
          .select();

        if (productsError) {
          console.error("Error creating products:", productsError);
          return NextResponse.json(
            { error: productsError.message },
            { status: 400 }
          );
        }

        products = (insertedProducts ?? []) as IDietProduct[];
      }

      mealsWithProducts.push({
        ...meal,
        diet_products: products,
        total_kcal: products.reduce((sum, p) => sum + Number(p.product_kcal), 0),
      });
    }

    const allProducts = mealsWithProducts.flatMap((m) => m.diet_products);

    const result: IDietDay = {
      ...day,
      diet_meals: mealsWithProducts,
      total_kcal: allProducts.reduce((sum, p) => sum + Number(p.product_kcal), 0),
      total_protein_value: allProducts.reduce(
        (sum, p) => sum + Number(p.protein_value),
        0
      ),
      total_carbs_value: allProducts.reduce(
        (sum, p) => sum + Number(p.carbs_value),
        0
      ),
      total_fat_value: allProducts.reduce(
        (sum, p) => sum + Number(p.fat_value),
        0
      ),
    };

    return NextResponse.json<ICreateDietDayResponse>(result, { status: 201 });
  } catch (error) {
    console.error("Create diet day error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
