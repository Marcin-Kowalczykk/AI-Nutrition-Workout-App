import type { AddMeasurementFormType } from "../types";
import { CIRCUMFERENCE_KEYS } from "./constants";
import { combineDateAndTime } from "./combine-date-and-time";

export const buildMeasurementPayload = (
  values: AddMeasurementFormType
): {
  weight_kg: number;
  height_cm: number | null;
  measured_at: string;
  arm_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
} => {
  const weight = Number(values.weight_kg);
  const height =
    values.height_cm !== "" && values.height_cm != null
      ? Number(values.height_cm)
      : null;
  const measuredAt = combineDateAndTime(
    values.measured_at,
    values.measured_at_time
  );
  const circumference: Record<string, number | null> = {};
  for (const key of CIRCUMFERENCE_KEYS) {
    const val = values[key];
    circumference[key] =
      val !== "" && val != null && !Number.isNaN(Number(val))
        ? Number(val)
        : null;
  }
  return {
    weight_kg: weight,
    height_cm: height ?? null,
    measured_at: measuredAt.toISOString(),
    ...circumference,
  } as {
    weight_kg: number;
    height_cm: number | null;
    measured_at: string;
    arm_cm: number | null;
    chest_cm: number | null;
    waist_cm: number | null;
    hips_cm: number | null;
    thigh_cm: number | null;
    calf_cm: number | null;
  };
};
