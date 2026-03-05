import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export const getMostFrequentReps = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string,
  limit: number
): number[] => {
  if (!normalizedExerciseName || !workouts?.length || limit <= 0) {
    return [];
  }

  const counts = new Map<number, number>();

  for (const workout of workouts) {
    const exercises = (workout.exercises ?? []) as IWorkoutExerciseItem[];

    for (const exercise of exercises) {
      if (
        normalizeForComparison(exercise.name ?? "") !== normalizedExerciseName
      ) {
        continue;
      }

      for (const set of (exercise.sets ?? []) as IWorkoutSetItem[]) {
        if (typeof set.reps !== "number" || Number.isNaN(set.reps)) {
          continue;
        }
        counts.set(set.reps, (counts.get(set.reps) ?? 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] - b[0];
    })
    .slice(0, limit)
    .map(([reps]) => reps);
};

