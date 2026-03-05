import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface MaxDurationRecord {
  duration: number;
  date: string;
}

export const getMaxDurationRecord = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string
): MaxDurationRecord | null => {
  if (!normalizedExerciseName || !workouts?.length) {
    return null;
  }

  let best: MaxDurationRecord | null = null;

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
          typeof set.duration !== "number" ||
          Number.isNaN(set.duration) ||
          set.duration <= 0
        ) {
          continue;
        }

        if (!best || set.duration > best.duration) {
          best = {
            duration: set.duration,
            date: workout.created_at,
          };
        }
      }
    }
  }

  return best;
};

