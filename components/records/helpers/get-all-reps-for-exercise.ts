import { normalizeForComparison } from "@/lib/normalize-string";
import type { IWorkoutItem } from "@/app/api/workouts/types";

export const getAllRepsForExercise = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string
): number[] => {
  if (!normalizedExerciseName || !workouts?.length) return [];

  const repsSet = new Set<number>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises ?? []) {
      if (
        normalizeForComparison(exercise.name ?? "") !== normalizedExerciseName
      ) {
        continue;
      }

      for (const set of exercise.sets ?? []) {
        if (
          !set.isChecked ||
          typeof set.reps !== "number" ||
          Number.isNaN(set.reps) ||
          set.reps <= 0
        ) {
          continue;
        }
        repsSet.add(set.reps);
      }
    }
  }

  return Array.from(repsSet)
    .sort((a, b) => a - b)
    .slice(0, 20);
};

