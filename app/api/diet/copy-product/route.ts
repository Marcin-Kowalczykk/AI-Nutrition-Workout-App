import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

//constants
import { TABLE_NAMES } from "@/app/api/tableNames";

//types
import type { IDietDay, IDietProduct } from "../types";

export type ICopyProductRequestBody = {
  product_id: string;
  target_date: string;
  target_meal_id?: string | null;
};

export type ICopyProductResponse = IDietDay;

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

    const body: ICopyProductRequestBody = await request.json();

    if (!body.product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }
    if (!body.target_date) {
      return NextResponse.json({ error: "target_date is required" }, { status: 400 });
    }

    const { data: sourceRow, error: productFetchError } = await supabase
      .from(TABLE_NAMES.DIET_PRODUCTS)
      .select(`
        id,
        product_name,
        product_kcal,
        protein_value,
        carbs_value,
        fat_value,
        weight_grams,
        kcal_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        ai_breakdown,
        diet_meals!inner(
          diet_days!inner(user_id)
        )
      `)
      .eq("id", body.product_id)
      .maybeSingle();

    if (productFetchError || !sourceRow) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const mealEmbed = sourceRow.diet_meals as unknown as {
      diet_days: { user_id: string };
    };

    if (mealEmbed.diet_days.user_id !== user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const sourceProduct = sourceRow as unknown as {
      id: string;
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
      ai_breakdown: IDietProduct["ai_breakdown"];
    };

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

    const targetMealId =
      typeof body.target_meal_id === "string" && body.target_meal_id.trim() !== ""
        ? body.target_meal_id.trim()
        : null;

    let insertMealId: string;

    if (targetMealId) {
      const { data: targetMeal, error: targetMealError } = await supabase
        .from(TABLE_NAMES.DIET_MEALS)
        .select(`
          id,
          diet_day_id,
          diet_days!inner(user_id)
        `)
        .eq("id", targetMealId)
        .eq("diet_day_id", targetDayId)
        .maybeSingle();

      if (targetMealError || !targetMeal) {
        return NextResponse.json({ error: "Target meal not found" }, { status: 404 });
      }

      const dayCheck = targetMeal.diet_days as unknown as { user_id: string };
      if (dayCheck.user_id !== user.id) {
        return NextResponse.json({ error: "Target meal not found" }, { status: 404 });
      }

      insertMealId = targetMeal.id;
    } else {
      const { data: existingMeals } = await supabase
        .from(TABLE_NAMES.DIET_MEALS)
        .select("meal_number")
        .eq("diet_day_id", targetDayId);

      const maxMealNumber =
        existingMeals && existingMeals.length > 0
          ? Math.max(...existingMeals.map((m) => m.meal_number))
          : 0;

      const { data: newMeal, error: newMealError } = await supabase
        .from(TABLE_NAMES.DIET_MEALS)
        .insert({ diet_day_id: targetDayId, meal_number: maxMealNumber + 1 })
        .select()
        .single();

      if (newMealError) {
        console.error("Error creating meal:", newMealError);
        return NextResponse.json({ error: newMealError.message }, { status: 400 });
      }

      insertMealId = newMeal.id;
    }

    const { error: insertProductError } = await supabase.from(TABLE_NAMES.DIET_PRODUCTS).insert({
      diet_meal_id: insertMealId,
      product_name: sourceProduct.product_name,
      product_kcal: sourceProduct.product_kcal,
      protein_value: sourceProduct.protein_value,
      carbs_value: sourceProduct.carbs_value,
      fat_value: sourceProduct.fat_value,
      weight_grams: sourceProduct.weight_grams ?? null,
      kcal_per_100g: sourceProduct.kcal_per_100g ?? null,
      protein_per_100g: sourceProduct.protein_per_100g ?? null,
      carbs_per_100g: sourceProduct.carbs_per_100g ?? null,
      fat_per_100g: sourceProduct.fat_per_100g ?? null,
      ai_breakdown: sourceProduct.ai_breakdown ?? null,
    });

    if (insertProductError) {
      console.error("Error copying product:", insertProductError);
      return NextResponse.json({ error: insertProductError.message }, { status: 400 });
    }

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

    return NextResponse.json<ICopyProductResponse>(result, { status: 201 });
  } catch (error) {
    console.error("Copy product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
