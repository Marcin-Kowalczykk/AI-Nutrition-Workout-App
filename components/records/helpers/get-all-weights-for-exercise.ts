import { normalizeForComparison } from "@/lib/normalize-string";
import type { IWorkoutItem } from "@/app/api/workouts/types";

export const getAllWeightsForExercise = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string
): number[] => {
  if (!normalizedExerciseName || !workouts?.length) return [];

  const weightsSet = new Set<number>();

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
          typeof set.weight !== "number" ||
          Number.isNaN(set.weight) ||
          set.weight <= 0
        ) {
          continue;
        }
        weightsSet.add(set.weight);
      }
    }
  }

  return Array.from(weightsSet)
    .sort((a, b) => a - b)
    .slice(0, 20);
};

