import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export type ExerciseLoadType = "none" | "weighted" | "repsOnly";

export const getExerciseLoadType = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string
): ExerciseLoadType => {
  if (!normalizedExerciseName || !workouts?.length) {
    return "none";
  }

  let hasAnyMatchingSets = false;

  for (const workout of workouts) {
    const exercises = (workout.exercises ?? []) as IWorkoutExerciseItem[];

    for (const exercise of exercises) {
      if (
        normalizeForComparison(exercise.name ?? "") !== normalizedExerciseName
      ) {
        continue;
      }

      for (const set of (exercise.sets ?? []) as IWorkoutSetItem[]) {
        if (
          typeof set.reps !== "number" ||
          Number.isNaN(set.reps) ||
          set.reps <= 0
        ) {
          continue;
        }

        hasAnyMatchingSets = true;

        if (typeof set.weight === "number" && set.weight > 0) {
          return "weighted";
        }
      }
    }
  }

  if (hasAnyMatchingSets) {
    return "repsOnly";
  }

  return "none";
};

