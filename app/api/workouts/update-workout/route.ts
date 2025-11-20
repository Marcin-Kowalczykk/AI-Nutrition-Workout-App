import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

export interface IUpdateWorkoutRequestBody {
  id: string;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  exercises?: Record<string, unknown>;
}

export interface IUpdateWorkoutResponse {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  exercises?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

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

    const body: IUpdateWorkoutRequestBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Workout ID is required" },
        { status: 400 }
      );
    }

    const { data: existingWorkout, error: fetchError } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .select("user_id")
      .eq("id", body.id)
      .single();

    if (fetchError || !existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    if (existingWorkout.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - workout does not belong to user" },
        { status: 403 }
      );
    }

    const updateData: Partial<IUpdateWorkoutRequestBody> = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.start_date !== undefined) {
      updateData.start_date = body.start_date;
    }
    if (body.end_date !== undefined) {
      updateData.end_date = body.end_date;
    }
    if (body.exercises !== undefined) {
      updateData.exercises = body.exercises;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workout:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IUpdateWorkoutResponse>(data, { status: 200 });
  } catch (error) {
    console.error("Update workout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
