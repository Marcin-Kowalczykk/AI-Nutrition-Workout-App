import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IWorkoutTemplateItem } from "../types";

export type IUpdateTemplateRequestBody = Partial<IWorkoutTemplateItem>;

export type IUpdateTemplateResponse = IWorkoutTemplateItem;

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

    const body: IUpdateTemplateRequestBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAMES.WORKOUT_TEMPLATES)
      .select("user_id")
      .eq("id", body.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - template does not belong to user" },
        { status: 403 }
      );
    }

    const updateData: Partial<IUpdateTemplateRequestBody> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.exercises !== undefined) updateData.exercises = body.exercises;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.WORKOUT_TEMPLATES)
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IUpdateTemplateResponse>(data, { status: 200 });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
