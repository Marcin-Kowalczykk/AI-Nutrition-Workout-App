import { format } from "date-fns";
import type { IBodyMeasurementItem } from "@/app/api/body-measurements/types";
import type { AddMeasurementFormType } from "../types";

const toStr = (v: number | null | undefined): string =>
  typeof v === "number" && !Number.isNaN(v) ? String(v) : "";

export const measurementToFormValues = (
  measurement: IBodyMeasurementItem
): AddMeasurementFormType => {
  const d = new Date(measurement.measured_at);
  return {
    weight_kg: String(measurement.weight_kg),
    height_cm: measurement.height_cm != null ? String(measurement.height_cm) : "",
    measured_at: d,
    measured_at_time: format(d, "HH:mm"),
    arm_cm: toStr(measurement.arm_cm),
    chest_cm: toStr(measurement.chest_cm),
    waist_cm: toStr(measurement.waist_cm),
    hips_cm: toStr(measurement.hips_cm),
    thigh_cm: toStr(measurement.thigh_cm),
    calf_cm: toStr(measurement.calf_cm),
  };
};
