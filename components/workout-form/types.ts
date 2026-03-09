import { z } from "zod";

export const WORKOUT_UNIT_TYPE = {
  REPS_BASED: "reps-based",
  DURATION: "duration",
} as const;

export type WorkoutUnitType =
  (typeof WORKOUT_UNIT_TYPE)[keyof typeof WORKOUT_UNIT_TYPE];

const baseOptionalNumericString = z.string().optional();

const optionalIntegerString = baseOptionalNumericString.refine(
  (v) => {
    if (v === undefined || v === null || v === "") return true;
    const num = Number(String(v).trim());
    return Number.isInteger(num) && num >= 0;
  },
  { message: "Must be a non-negative integer or empty" }
);

const optionalWeightString = baseOptionalNumericString.refine(
  (v) => {
    if (v === undefined || v === null || v === "") return true;
    const str = String(v).trim();
    const num = Number(str);
    if (Number.isNaN(num) || num < 0) return false;
    const dotIndex = str.indexOf(".");
    if (dotIndex === -1) return true;
    const decimals = str.slice(dotIndex + 1);
    return decimals.length <= 1;
  },
  { message: "Weight can have at most one decimal place" }
);

const workoutSetSchema = z.object({
  id: z.string(),
  set_number: z.number().optional(),
  reps: optionalIntegerString,
  weight: optionalWeightString,
  duration: optionalIntegerString,
  isChecked: z.boolean().optional(),
});

const unitTypeSchema = z.enum([
  WORKOUT_UNIT_TYPE.REPS_BASED,
  WORKOUT_UNIT_TYPE.DURATION,
]);

const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  unitType: unitTypeSchema.optional(),
  sets: z.array(workoutSetSchema),
});

const baseWorkoutFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  workout_date: z.string().optional(),
  exercises: z.array(workoutExerciseSchema),
});

export const templateWorkoutFormSchema = baseWorkoutFormSchema;

export const createWorkoutFormSchema = baseWorkoutFormSchema.superRefine(
  (values, ctx) => {
    (values.exercises ?? []).forEach((exercise, exerciseIndex) => {
      const unitType =
        (exercise.unitType as WorkoutUnitType | undefined) ??
        WORKOUT_UNIT_TYPE.REPS_BASED;

      (exercise.sets ?? []).forEach((set, setIndex) => {
        if (!set) return;

        if (unitType === WORKOUT_UNIT_TYPE.DURATION) {
          const durationVal = (set.duration ?? "").toString().trim();
          if (!durationVal) {
            ctx.addIssue({
              code: "custom",
              message: "Duration is required for time-based sets",
              path: ["exercises", exerciseIndex, "sets", setIndex, "duration"],
            });
            return;
          }

          const durationNum = Number(durationVal);
          if (Number.isNaN(durationNum) || durationNum <= 0) {
            ctx.addIssue({
              code: "custom",
              message: "Duration must be greater than 0",
              path: ["exercises", exerciseIndex, "sets", setIndex, "duration"],
            });
          }
        } else if (unitType === WORKOUT_UNIT_TYPE.REPS_BASED) {
          const repsVal = (set.reps ?? "").toString().trim();
          if (!repsVal) {
            ctx.addIssue({
              code: "custom",
              message: "Reps are required for reps-based sets",
              path: ["exercises", exerciseIndex, "sets", setIndex, "reps"],
            });
            return;
          }

          const repsNum = Number(repsVal);
          if (Number.isNaN(repsNum) || repsNum <= 0) {
            ctx.addIssue({
              code: "custom",
              message: "Reps must be greater than 0",
              path: ["exercises", exerciseIndex, "sets", setIndex, "reps"],
            });
          }
        }
      });
    });
  }
);

export type CreateWorkoutFormType = z.infer<typeof baseWorkoutFormSchema>;
