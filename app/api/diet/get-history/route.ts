import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

//constants
import { TABLE_NAMES } from "@/app/api/tableNames";

//types
import type { IDietDay, IDietMeal, IDietProduct } from "../types";

export type IGetDietHistoryResponse = {
  days: IDietDay[];
};

type RawProduct = Omit<IDietProduct, never>;

type RawMeal = {
  id: string;
  diet_day_id: string;
  meal_number: number;
  created_at: string;
  diet_products: RawProduct[];
};

type RawDay = {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  updated_at: string;
  diet_meals: RawMeal[];
};

const enrichDay = (day: RawDay): IDietDay => {
  const meals: IDietMeal[] = (day.diet_meals ?? [])
    .sort((a, b) => a.meal_number - b.meal_number)
    .map((meal) => ({
      ...meal,
      total_kcal: (meal.diet_products ?? []).reduce(
        (sum, p) => sum + Number(p.product_kcal),
        0
      ),
    }));

  const allProducts = meals.flatMap((m) => m.diet_products ?? []);

  return {
    ...day,
    diet_meals: meals,
    total_kcal: allProducts.reduce((sum, p) => sum + Number(p.product_kcal), 0),
    total_protein_value: allProducts.reduce((sum, p) => sum + Number(p.protein_value), 0),
    total_carbs_value: allProducts.reduce((sum, p) => sum + Number(p.carbs_value), 0),
    total_fat_value: allProducts.reduce((sum, p) => sum + Number(p.fat_value), 0),
  };
};

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const startDatePart = startDate ? startDate.split("T")[0] : null;
    const endDatePart = endDate ? endDate.split("T")[0] : null;

    let query = supabase
      .from(TABLE_NAMES.DIET_DAYS)
      .select("*, diet_meals (*, diet_products (*))")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (startDatePart) query = query.gte("date", startDatePart);
    if (endDatePart) query = query.lte("date", endDatePart);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching diet history:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const days = ((data as RawDay[]) ?? []).map(enrichDay);

    return NextResponse.json<IGetDietHistoryResponse>({ days }, { status: 200 });
  } catch (error) {
    console.error("Get diet history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
