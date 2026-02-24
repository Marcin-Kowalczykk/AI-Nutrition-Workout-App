import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IWorkoutTemplateItem } from "../types";

export type ICreateTemplateRequestBody = Omit<
  IWorkoutTemplateItem,
  "user_id" | "created_at" | "updated_at" | "id"
>;

export type ICreateTemplateResponse = IWorkoutTemplateItem;

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

    const body: ICreateTemplateRequestBody = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.WORKOUT_TEMPLATES)
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        exercises: body.exercises ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<ICreateTemplateResponse>(data, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
