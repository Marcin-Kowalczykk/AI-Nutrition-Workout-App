import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IBodyMeasurementItem } from "../types";

export type IUpdateBodyMeasurementRequestBody = {
  weight_kg?: number;
  height_cm?: number | null;
  measured_at?: string;
  arm_cm?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  thigh_cm?: number | null;
  calf_cm?: number | null;
};

export type IUpdateBodyMeasurementResponse = IBodyMeasurementItem;

export async function PATCH(request: Request) {
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

    const body: IUpdateBodyMeasurementRequestBody = await request.json();

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

    const updatePayload: Record<string, unknown> = {};

    if (body.weight_kg !== undefined) {
      const weight = Number(body.weight_kg);
      if (Number.isNaN(weight) || weight <= 0) {
        return NextResponse.json(
          { error: "Weight must be a number greater than zero" },
          { status: 400 }
        );
      }
      updatePayload.weight_kg = weight;
    }

    if (body.height_cm !== undefined) {
      updatePayload.height_cm = body.height_cm;
    }

    if (body.measured_at !== undefined) {
      updatePayload.measured_at = body.measured_at;
    }

    const circumferenceKeys = [
      "arm_cm",
      "chest_cm",
      "waist_cm",
      "hips_cm",
      "thigh_cm",
      "calf_cm",
    ] as const;
    for (const key of circumferenceKeys) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      const { data: current } = await supabase
        .from(TABLE_NAMES.BODY_MEASUREMENTS)
        .select("*")
        .eq("id", id)
        .single();
      return NextResponse.json<IUpdateBodyMeasurementResponse>(current, {
        status: 200,
      });
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.BODY_MEASUREMENTS)
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating body measurement:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<IUpdateBodyMeasurementResponse>(data, {
      status: 200,
    });
  } catch (error) {
    console.error("Update body measurement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
