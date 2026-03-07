import { format } from "date-fns";
import type { IBodyMeasurementItem } from "@/app/api/body-measurements/types";
import type { AddMeasurementFormType } from "../types";

const toStr = (v: number | null | undefined): string =>
  typeof v === "number" && !Number.isNaN(v) ? String(v) : "";

export const getDefaultValuesFromLast = (
  lastMeasurement: IBodyMeasurementItem | null | undefined
): AddMeasurementFormType => {
  const now = new Date();
  if (!lastMeasurement) {
    return {
      weight_kg: "",
      height_cm: "",
      measured_at: now,
      measured_at_time: format(now, "HH:mm"),
      arm_cm: "",
      chest_cm: "",
      waist_cm: "",
      hips_cm: "",
      thigh_cm: "",
      calf_cm: "",
    };
  }
  return {
    weight_kg: String(lastMeasurement.weight_kg),
    height_cm: toStr(lastMeasurement.height_cm),
    measured_at: now,
    measured_at_time: format(now, "HH:mm"),
    arm_cm: toStr(lastMeasurement.arm_cm),
    chest_cm: toStr(lastMeasurement.chest_cm),
    waist_cm: toStr(lastMeasurement.waist_cm),
    hips_cm: toStr(lastMeasurement.hips_cm),
    thigh_cm: toStr(lastMeasurement.thigh_cm),
    calf_cm: toStr(lastMeasurement.calf_cm),
  };
};
