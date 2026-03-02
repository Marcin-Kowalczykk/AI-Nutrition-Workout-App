import { z } from "zod";

export const WORKOUT_UNIT_TYPE = {
  WEIGHT: "weight",
  DURATION: "duration",
} as const;

export type WorkoutUnitType =
  (typeof WORKOUT_UNIT_TYPE)[keyof typeof WORKOUT_UNIT_TYPE];

const workoutSetSchema = z.object({
  id: z.string(),
  set_number: z.number().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  duration: z.number().optional(),
  isChecked: z.boolean().optional(),
});

const unitTypeSchema = z.enum([
  WORKOUT_UNIT_TYPE.WEIGHT,
  WORKOUT_UNIT_TYPE.DURATION,
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
  exercises: z.array(workoutExerciseSchema),
});

export type CreateWorkoutFormType = z.infer<typeof createWorkoutFormSchema>;
