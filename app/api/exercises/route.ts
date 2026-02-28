import { createClient } from "@/lib/supabase/server";
import { normalizeForComparison } from "@/lib/normalize-string";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IExercise } from "./types";

const DEFAULT_CATEGORY_NAME = "other";

export interface IListExercisesResponse {
  exercises: IExercise[];
}

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
    const categoryId = searchParams.get("categoryId") ?? undefined;

    let query = supabase
      .from(TABLE_NAMES.EXERCISES)
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching exercises:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IListExercisesResponse>(
      { exercises: data ?? [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("List exercises error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export interface ICreateExerciseRequestBody {
  name: string;
  categoryId?: string;
}

export type ICreateExerciseResponse = IExercise;

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

    const body: ICreateExerciseRequestBody = await request.json();
    const name = (body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Exercise name is required" },
        { status: 400 }
      );
    }

    let categoryId = body.categoryId;

    if (!categoryId) {
      const { data: existingCategory } = await supabase
        .from(TABLE_NAMES.EXERCISE_CATEGORIES)
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", DEFAULT_CATEGORY_NAME)
        .limit(1)
        .maybeSingle();

      if (existingCategory?.id) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCategory, error: catError } = await supabase
          .from(TABLE_NAMES.EXERCISE_CATEGORIES)
          .insert({ user_id: user.id, name: DEFAULT_CATEGORY_NAME })
          .select("id")
          .single();

        if (catError || !newCategory) {
          console.error("Error creating default category:", catError);
          return NextResponse.json(
            { error: "Could not create default category" },
            { status: 400 }
          );
        }
        categoryId = newCategory.id;
      }
    }

    const { data: category } = await supabase
      .from(TABLE_NAMES.EXERCISE_CATEGORIES)
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", user.id)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.EXERCISES)
      .insert({
        user_id: user.id,
        category_id: categoryId,
        name: normalizeForComparison(name),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating exercise:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<ICreateExerciseResponse>(data, { status: 201 });
  } catch (error) {
    console.error("Create exercise error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export interface IDeleteExercisesRequestBody {
  ids: string[];
}

export type IDeleteExercisesResponse = { success: true };

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

    const body: IDeleteExercisesRequestBody = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "At least one exercise id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(TABLE_NAMES.EXERCISES)
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) {
      console.error("Error deleting exercises:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IDeleteExercisesResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete exercises error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
