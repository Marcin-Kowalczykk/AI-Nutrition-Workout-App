import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

// types
import { IWorkoutItem } from "../types";

export interface IGetWorkoutResponse {
  workout: IWorkoutItem;
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
    const workoutId = searchParams.get("id");

    if (!workoutId) {
      return NextResponse.json(
        { error: "Workout ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.error("Error fetching workout:", error);
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    return NextResponse.json<IGetWorkoutResponse>(
      {
        workout: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get workout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
