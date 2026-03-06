import { z } from "zod";

export const WORKOUT_UNIT_TYPE = {
  WEIGHT: "weight",
  DURATION: "duration",
  REPS_ONLY: "reps-only",
} as const;

export type WorkoutUnitType =
  (typeof WORKOUT_UNIT_TYPE)[keyof typeof WORKOUT_UNIT_TYPE];

const preprocessOptionalNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") {
    return undefined;
  }
  if (typeof val === "number") {
    return val;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;
    const num = Number(trimmed);
    if (Number.isNaN(num)) return undefined;
    return num;
  }
  return undefined;
};

const nonNegativeNumber = z.preprocess(
  preprocessOptionalNumber,
  z.union([z.number().min(0, "Input values must be greater than 0"), z.undefined()])
);

const workoutSetSchema = z.object({
  id: z.string(),
  set_number: z.number().optional(),
  reps: nonNegativeNumber,
  weight: nonNegativeNumber,
  duration: nonNegativeNumber,
  isChecked: z.boolean().optional(),
});

const unitTypeSchema = z.enum([
  WORKOUT_UNIT_TYPE.WEIGHT,
  WORKOUT_UNIT_TYPE.DURATION,
  WORKOUT_UNIT_TYPE.REPS_ONLY,
]);

const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  unitType: unitTypeSchema.optional(),
  sets: z.array(workoutSetSchema),
});

export const createWorkoutFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  workout_date: z.string().optional(),
  exercises: z.array(workoutExerciseSchema),
});

export type CreateWorkoutFormType = z.infer<typeof createWorkoutFormSchema>;
