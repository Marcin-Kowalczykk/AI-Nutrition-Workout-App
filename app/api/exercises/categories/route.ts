import { createClient } from "@/lib/supabase/server";
import { normalizeForComparison } from "@/lib/normalize-string";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IExerciseCategory } from "../types";

export interface IListCategoriesResponse {
  categories: IExerciseCategory[];
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing, error } = await supabase
      .from(TABLE_NAMES.EXERCISE_CATEGORIES)
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const categories = existing ?? [];
    if (categories.length === 0) {
      const { data: defaultCategory, error: insertError } = await supabase
        .from(TABLE_NAMES.EXERCISE_CATEGORIES)
        .insert({ user_id: user.id, name: "other" })
        .select()
        .single();
      if (!insertError && defaultCategory) {
        return NextResponse.json<IListCategoriesResponse>(
          { categories: [defaultCategory] },
          { status: 200 }
        );
      }
    }

    return NextResponse.json<IListCategoriesResponse>(
      { categories },
      { status: 200 }
    );
  } catch (error) {
    console.error("List categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export interface ICreateCategoryRequestBody {
  name: string;
}

export type ICreateCategoryResponse = IExerciseCategory;

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

    const body: ICreateCategoryRequestBody = await request.json();
    const name = (body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.EXERCISE_CATEGORIES)
      .insert({ user_id: user.id, name: normalizeForComparison(name) })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<ICreateCategoryResponse>(data, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export interface IDeleteCategoriesRequestBody {
  ids: string[];
}

export type IDeleteCategoriesResponse = { success: true };

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: IDeleteCategoriesRequestBody = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "At least one category id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(TABLE_NAMES.EXERCISE_CATEGORIES)
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) {
      console.error("Error deleting categories:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IDeleteCategoriesResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
