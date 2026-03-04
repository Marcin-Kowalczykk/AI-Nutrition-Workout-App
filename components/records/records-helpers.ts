import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

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
        if (typeof set.reps === "number" && !Number.isNaN(set.reps)) {
          repsSet.add(set.reps);
        }
      }
    }
  }

  return Array.from(repsSet)
    .sort((a, b) => a - b)
    .slice(0, 20);
};

export interface BestRecord {
  reps: number;
  weight: number;
  date: string;
  workoutName: string;
}

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
          typeof set.reps !== "number" ||
          Number.isNaN(set.reps) ||
          !repsSet.has(set.reps)
        ) {
          continue;
        }

        if (typeof set.weight !== "number" || Number.isNaN(set.weight)) {
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

