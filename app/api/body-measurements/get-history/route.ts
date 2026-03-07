import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IBodyMeasurementItem } from "../types";

export interface IGetBodyMeasurementsHistoryResponse {
  measurements: IBodyMeasurementItem[];
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
      .from(TABLE_NAMES.BODY_MEASUREMENTS)
      .select("*")
      .eq("user_id", user.id);

    if (startDate && endDate) {
      query = query
        .gte("measured_at", startDate)
        .lte("measured_at", endDate);
    } else if (startDate) {
      query = query.gte("measured_at", startDate);
    } else if (endDate) {
      query = query.lte("measured_at", endDate);
    }

    query = query.order("measured_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching body measurements history:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IGetBodyMeasurementsHistoryResponse>(
      {
        measurements: data || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get body measurements history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
