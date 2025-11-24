import { z } from "zod";

const workoutSetSchema = z.object({
  id: z.string(),
  set_number: z.number().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  duration: z.number().optional(),
  isChecked: z.boolean().optional(),
});

const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  sets: z.array(workoutSetSchema),
});

export const createWorkoutFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  exercises: z.array(workoutExerciseSchema),
});

export type CreateWorkoutFormType = z.infer<typeof createWorkoutFormSchema>;
