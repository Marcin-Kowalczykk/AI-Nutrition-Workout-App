import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

// types
import { IWorkoutItem } from "../types";

export type ICreateWorkoutRequestBody = Omit<
  IWorkoutItem,
  "user_id" | "created_at" | "updated_at" | "id"
> & { created_at?: string };

export type ICreateWorkoutResponse = IWorkoutItem;

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

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      name: body.name,
      description: body.description,
      start_date: body.start_date,
      end_date: body.end_date,
      exercises: body.exercises,
    };
    if (body.created_at) {
      insertPayload.created_at = body.created_at;
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .insert(insertPayload)
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
