import type { IBodyMeasurementItem } from "@/app/api/body-measurements/types";
import { CIRCUMFERENCE_KEYS } from "./constants";

export const hasCircumference = (m: IBodyMeasurementItem): boolean =>
  CIRCUMFERENCE_KEYS.some(
    (key) => m[key] != null && !Number.isNaN(Number(m[key]))
  );
