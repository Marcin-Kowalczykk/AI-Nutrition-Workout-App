import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// constants
import { TABLE_NAMES } from "@/app/api/tableNames";

// types
import { IBodyMeasurementItem } from "../types";

export type ICreateBodyMeasurementRequestBody = {
  weight_kg: number;
  height_cm?: number | null;
  measured_at?: string;
  arm_cm?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  thigh_cm?: number | null;
  calf_cm?: number | null;
};

export type ICreateBodyMeasurementResponse = IBodyMeasurementItem;

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

    const body: ICreateBodyMeasurementRequestBody = await request.json();

    if (body.weight_kg == null || body.weight_kg === undefined) {
      return NextResponse.json(
        { error: "Weight (weight_kg) is required" },
        { status: 400 }
      );
    }

    const weight = Number(body.weight_kg);
    if (Number.isNaN(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "Weight must be a number greater than zero" },
        { status: 400 }
      );
    }

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      weight_kg: weight,
      height_cm: body.height_cm ?? null,
      measured_at: body.measured_at ?? new Date().toISOString(),
      arm_cm: body.arm_cm ?? null,
      chest_cm: body.chest_cm ?? null,
      waist_cm: body.waist_cm ?? null,
      hips_cm: body.hips_cm ?? null,
      thigh_cm: body.thigh_cm ?? null,
      calf_cm: body.calf_cm ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE_NAMES.BODY_MEASUREMENTS)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating body measurement:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json<ICreateBodyMeasurementResponse>(data, {
      status: 201,
    });
  } catch (error) {
    console.error("Create body measurement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
