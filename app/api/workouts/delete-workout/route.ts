import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

export type IDeleteWorkoutResponse = { success: true };

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Workout ID is required" },
        { status: 400 }
      );
    }

    const { data: existingWorkout, error: fetchError } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting workout:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IDeleteWorkoutResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete workout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
