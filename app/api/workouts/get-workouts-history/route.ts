import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

export interface IWorkoutHistoryItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  exercises?: Record<string, unknown>;
  created_at: string;
}

export interface IGetWorkoutsHistoryResponse {
  workouts: IWorkoutHistoryItem[];
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
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .select("*")
      .eq("user_id", user.id);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching workouts history:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IGetWorkoutsHistoryResponse>(
      {
        workouts: data || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get workouts history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
