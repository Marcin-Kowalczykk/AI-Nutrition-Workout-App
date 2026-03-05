import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface MaxRepsRecord {
  reps: number;
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

        if (!best || set.reps > best.reps) {
          best = {
            reps: set.reps,
            date: workout.created_at,
          };
        }
      }
    }
  }

  return best;
};

