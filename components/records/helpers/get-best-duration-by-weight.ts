import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface BestDurationByWeightRecord {
  weight: number;
  duration: number;
  date: string;
  workoutName: string;
}

export const getBestDurationByWeight = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string
): BestDurationByWeightRecord[] => {
  if (!normalizedExerciseName || !workouts?.length) {
    return [];
  }

  const bestByWeight = new Map<number, BestDurationByWeightRecord>();

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
          set.duration <= 0 ||
          typeof set.weight !== "number" ||
          Number.isNaN(set.weight) ||
          set.weight <= 0
        ) {
          continue;
        }

        const existing = bestByWeight.get(set.weight);
        if (!existing || set.duration > existing.duration) {
          bestByWeight.set(set.weight, {
            weight: set.weight,
            duration: set.duration,
            date: workout.created_at,
            workoutName: workout.name,
          });
        }
      }
    }
  }

  return Array.from(bestByWeight.values()).sort((a, b) => a.weight - b.weight);
};

