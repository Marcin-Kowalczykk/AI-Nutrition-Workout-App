import { z } from "zod";

export const WORKOUT_UNIT_TYPE = {
  WEIGHT: "weight",
  DURATION: "duration",
  REPS_ONLY: "reps-only",
} as const;

export type WorkoutUnitType =
  (typeof WORKOUT_UNIT_TYPE)[keyof typeof WORKOUT_UNIT_TYPE];

const nonNegativeNumber = z
  .number()
  .min(0, "Input values must be greater than 0")
  .optional();

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
