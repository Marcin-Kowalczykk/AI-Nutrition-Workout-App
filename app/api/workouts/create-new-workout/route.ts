import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

export interface ICreateWorkoutRequestBody {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  exercises?: Record<string, unknown>;
}

export interface ICreateWorkoutResponse {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  exercises?: Record<string, unknown>;
  created_at: string;
}

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

    const body: ICreateWorkoutRequestBody = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        exercises: body.exercises,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating workout:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<ICreateWorkoutResponse>(data, { status: 201 });
  } catch (error) {
    console.error("Create workout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
