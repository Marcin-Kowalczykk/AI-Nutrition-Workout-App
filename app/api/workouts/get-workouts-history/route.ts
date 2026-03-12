import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "../../tableNames";

// types
import { IWorkoutItem } from "../types";

export interface IGetWorkoutsHistoryResponse {
  workouts: IWorkoutItem[];
  hasMore: boolean;
  total?: number | null;
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
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("page_size");
    const legacyLimitParam = searchParams.get("limit");

    const MAX_PAGE_SIZE = 500;

    const page = pageParam ? Math.max(Number(pageParam) || 1, 1) : null;
    const pageSize = pageSizeParam
      ? Math.min(Math.max(Number(pageSizeParam) || 1, 1), MAX_PAGE_SIZE)
      : null;

    const legacyLimit =
      !page && !pageSize && legacyLimitParam && !Number.isNaN(Number(legacyLimitParam))
        ? Math.min(Number(legacyLimitParam), MAX_PAGE_SIZE)
        : null;

    let query = supabase
      .from(TABLE_NAMES.WORKOUT_PLANS)
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (startDate && endDate) {
      query = query.gte("created_at", startDate).lte("created_at", endDate);
    } else if (startDate) {
      query = query.gte("created_at", startDate);
    } else if (endDate) {
      query = query.lte("created_at", endDate);
    }

    query = query.order("created_at", { ascending: false });

    if (page && pageSize) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    } else if (legacyLimit !== null) {
      query = query.range(0, legacyLimit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching workouts history:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const workouts = (data || []) as IWorkoutItem[];
    const total = typeof count === "number" ? count : null;

    let hasMore = false;

    if (page && pageSize && total !== null) {
      hasMore = page * pageSize < total;
    } else if (legacyLimit !== null && total !== null) {
      hasMore = total > legacyLimit;
    }

    return NextResponse.json<IGetWorkoutsHistoryResponse>(
      {
        workouts,
        hasMore,
        total,
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
