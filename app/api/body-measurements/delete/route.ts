import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

export type IDeleteBodyMeasurementResponse = { success: true };

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
        { error: "Measurement ID is required" },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAMES.BODY_MEASUREMENTS)
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Measurement not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from(TABLE_NAMES.BODY_MEASUREMENTS)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting body measurement:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IDeleteBodyMeasurementResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete body measurement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
