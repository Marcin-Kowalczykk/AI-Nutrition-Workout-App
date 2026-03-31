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

export type IUpdateDietDayRequestBody = {
  id: string;
  date: string;
  meals: MealInput[];
};

export type IUpdateDietDayResponse = IDietDay;

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: IUpdateDietDayRequestBody = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    if (!body.date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    if (!body.meals || body.meals.length === 0) {
      return NextResponse.json(
        { error: "At least one meal is required" },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAMES.DIET_DAYS)
      .select("id")
      .eq("id", body.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Diet day not found" }, { status: 404 });
    }

    const { data: updatedDay, error: updateError } = await supabase
      .from(TABLE_NAMES.DIET_DAYS)
      .update({ date: body.date, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "A diet plan for this date already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const { error: deleteMealsError } = await supabase
      .from(TABLE_NAMES.DIET_MEALS)
      .delete()
      .eq("diet_day_id", body.id);

    if (deleteMealsError) {
      return NextResponse.json(
        { error: deleteMealsError.message },
        { status: 400 }
      );
    }

    const mealsWithProducts = [];

    for (let i = 0; i < body.meals.length; i++) {
      const mealInput = body.meals[i];

      const { data: meal, error: mealError } = await supabase
        .from(TABLE_NAMES.DIET_MEALS)
        .insert({ diet_day_id: body.id, meal_number: i + 1 })
        .select()
        .single();

      if (mealError) {
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
      ...updatedDay,
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

    return NextResponse.json<IUpdateDietDayResponse>(result, { status: 200 });
  } catch (error) {
    console.error("Update diet day error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
