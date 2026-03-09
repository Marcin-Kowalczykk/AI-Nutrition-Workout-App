import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface MaxRepsRecord {
  reps: number;
  weight: number | null;
  date: string;
}

export const getMaxRepsRecord = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string
): MaxRepsRecord | null => {
  if (!normalizedExerciseName || !workouts?.length) {
    return null;
  }

  let best: MaxRepsRecord | null = null;

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
          !set.isChecked ||
          typeof set.reps !== "number" ||
          Number.isNaN(set.reps) ||
          set.reps <= 0
        ) {
          continue;
        }

        const weight =
          typeof set.weight === "number" && !Number.isNaN(set.weight)
            ? set.weight
            : null;

        if (
          !best ||
          set.reps > best.reps ||
          (set.reps === best.reps &&
            weight !== null &&
            (best.weight === null || weight > best.weight))
        ) {
          best = {
            reps: set.reps,
            weight,
            date: workout.created_at,
          };
        }
      }
    }
  }

  return best;
};

