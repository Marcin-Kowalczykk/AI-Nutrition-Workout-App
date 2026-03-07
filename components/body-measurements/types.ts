import { z } from "zod";
import { isValidNumeric } from "./helpers/numeric-validation";

const optionalNumericString = z
  .string()
  .optional()
  .refine(
    (v) =>
      v === undefined ||
      v === "" ||
      isValidNumeric(v),
    { message: "Invalid value" }
  );

export const addMeasurementFormSchema = z.object({
  weight_kg: z
    .string()
    .min(1, "Weight is required")
    .refine(
      (v) => isValidNumeric(v),
      { message: "Invalid value" }
    ),
  height_cm: optionalNumericString,
  measured_at: z.date(),
  measured_at_time: z.string().optional(),
  arm_cm: optionalNumericString,
  chest_cm: optionalNumericString,
  waist_cm: optionalNumericString,
  hips_cm: optionalNumericString,
  thigh_cm: optionalNumericString,
  calf_cm: optionalNumericString,
});

export type AddMeasurementFormType = z.infer<typeof addMeasurementFormSchema>;

export const CIRCUMFERENCE_LABELS: Record<string, string> = {
  arm_cm: "Arm",
  chest_cm: "Chest",
  waist_cm: "Waist",
  hips_cm: "Hips",
  thigh_cm: "Thigh",
  calf_cm: "Calf",
};
