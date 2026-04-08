import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

//constants
import { TABLE_NAMES } from "@/app/api/tableNames";

//types
import type { IDietDay, IDietProduct } from "../types";

export type IAddMealRequestBody = {
  products: Array<{
    product_name: string;
    kcal: string;
    protein: string;
    carbs: string;
    fat: string;
    weight_grams: string;
    breakdown: { name: string; weight_g: number; kcal: number; protein?: number; carbs?: number; fat?: number }[] | null;
  }>;
  target_date: string;
};

export type IAddMealResponse = IDietDay;

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

    const body: IAddMealRequestBody = await request.json();

    if (!body.products || body.products.length === 0) {
      return NextResponse.json({ error: "products is required" }, { status: 400 });
    }
    if (!body.target_date) {
      return NextResponse.json({ error: "target_date is required" }, { status: 400 });
    }

    // 1. Find or create diet day for target_date
    const { data: existingDay } = await supabase
      .from(TABLE_NAMES.DIET_DAYS)
      .select("id")
      .eq("user_id", user.id)
      .eq("date", body.target_date)
      .maybeSingle();

    let targetDayId: string;

    if (existingDay) {
      targetDayId = existingDay.id;
    } else {
      const { data: newDay, error: createDayError } = await supabase
        .from(TABLE_NAMES.DIET_DAYS)
        .insert({ user_id: user.id, date: body.target_date })
        .select()
        .single();

      if (createDayError) {
        console.error("Error creating diet day:", createDayError);
        return NextResponse.json({ error: createDayError.message }, { status: 400 });
      }

      targetDayId = newDay.id;
    }

    // 2. Determine next meal_number
    const { data: existingMeals } = await supabase
      .from(TABLE_NAMES.DIET_MEALS)
      .select("meal_number")
      .eq("diet_day_id", targetDayId);

    const maxMealNumber =
      existingMeals && existingMeals.length > 0
        ? Math.max(...existingMeals.map((m) => m.meal_number))
        : 0;

    // 3. Insert new meal
    const { data: newMeal, error: newMealError } = await supabase
      .from(TABLE_NAMES.DIET_MEALS)
      .insert({ diet_day_id: targetDayId, meal_number: maxMealNumber + 1 })
      .select()
      .single();

    if (newMealError) {
      console.error("Error creating meal:", newMealError);
      return NextResponse.json({ error: newMealError.message }, { status: 400 });
    }

    // 4. Insert products
    const { error: productsError } = await supabase
      .from(TABLE_NAMES.DIET_PRODUCTS)
      .insert(
        body.products.map((p) => ({
          diet_meal_id: newMeal.id,
          product_name: p.product_name,
          product_kcal: parseFloat(p.kcal) || 0,
          protein_value: parseFloat(p.protein) || 0,
          carbs_value: parseFloat(p.carbs) || 0,
          fat_value: parseFloat(p.fat) || 0,
          weight_grams: p.weight_grams ? parseFloat(p.weight_grams) : null,
          kcal_per_100g: null,
          protein_per_100g: null,
          carbs_per_100g: null,
          fat_per_100g: null,
          ai_breakdown: p.breakdown ?? null,
        }))
      );

    if (productsError) {
      console.error("Error inserting products:", productsError);
      return NextResponse.json({ error: productsError.message }, { status: 400 });
    }

    // 5. Fetch and return full IDietDay
    const { data: allMealsRaw, error: allMealsError } = await supabase
      .from(TABLE_NAMES.DIET_MEALS)
      .select(`
        id, meal_number, diet_day_id, created_at,
        diet_products(
          id, diet_meal_id, product_name, product_kcal,
          protein_value, carbs_value, fat_value,
          weight_grams, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          ai_breakdown, created_at
        )
      `)
      .eq("diet_day_id", targetDayId)
      .order("meal_number", { ascending: true });

    if (allMealsError) {
      return NextResponse.json({ error: allMealsError.message }, { status: 400 });
    }

    const { data: targetDay, error: targetDayError } = await supabase
      .from(TABLE_NAMES.DIET_DAYS)
      .select("*")
      .eq("id", targetDayId)
      .single();

    if (targetDayError) {
      return NextResponse.json({ error: targetDayError.message }, { status: 400 });
    }

    const mealsWithTotals = (allMealsRaw ?? []).map((meal) => ({
      ...meal,
      diet_products: (meal.diet_products ?? []) as IDietProduct[],
      total_kcal: (meal.diet_products ?? []).reduce(
        (s, p) => s + Number((p as IDietProduct).product_kcal),
        0
      ),
    }));

    const allProducts = mealsWithTotals.flatMap((m) => m.diet_products);

    const result: IDietDay = {
      ...targetDay,
      diet_meals: mealsWithTotals,
      total_kcal: allProducts.reduce((s, p) => s + Number(p.product_kcal), 0),
      total_protein_value: allProducts.reduce((s, p) => s + Number(p.protein_value), 0),
      total_carbs_value: allProducts.reduce((s, p) => s + Number(p.carbs_value), 0),
      total_fat_value: allProducts.reduce((s, p) => s + Number(p.fat_value), 0),
    };

    return NextResponse.json<IAddMealResponse>(result, { status: 201 });
  } catch (error) {
    console.error("Add meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
