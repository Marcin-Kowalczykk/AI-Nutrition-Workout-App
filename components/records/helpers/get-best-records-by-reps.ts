import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface BestRecord {
  reps: number;
  weight: number;
  date: string;
  workoutName: string;
}

export const getBestRecordsByReps = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string,
  repsList: number[]
): BestRecord[] => {
  if (!normalizedExerciseName || !workouts?.length || !repsList.length) {
    return [];
  }

  const repsSet = new Set(repsList);
  const bestByReps = new Map<number, BestRecord>();

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
          set.reps <= 0 ||
          !repsSet.has(set.reps)
        ) {
          continue;
        }

        if (
          typeof set.weight !== "number" ||
          Number.isNaN(set.weight) ||
          set.weight <= 0
        ) {
          continue;
        }

        const existing = bestByReps.get(set.reps);
        if (!existing || set.weight > existing.weight) {
          bestByReps.set(set.reps, {
            reps: set.reps,
            weight: set.weight,
            date: workout.created_at,
            workoutName: workout.name,
          });
        }
      }
    }
  }

  return Array.from(bestByReps.values()).sort((a, b) => a.reps - b.reps);
};

