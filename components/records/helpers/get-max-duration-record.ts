import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface MaxDurationRecord {
  duration: number;
  weight: number | null;
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

        const weight =
          typeof set.weight === "number" && !Number.isNaN(set.weight) && set.weight > 0
            ? set.weight
            : null;

        if (
          !best ||
          set.duration > best.duration ||
          (set.duration === best.duration &&
            weight !== null &&
            (best.weight === null || weight > best.weight))
        ) {
          best = {
            duration: set.duration,
            weight,
            date: workout.created_at,
          };
        }
      }
    }
  }

  return best;
};

