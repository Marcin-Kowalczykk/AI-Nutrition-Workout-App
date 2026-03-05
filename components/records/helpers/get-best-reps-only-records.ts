import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";

export interface RepsOnlyRecord {
  targetReps: number;
  bestReps: number | null;
  date: string | null;
}

export const getBestRepsOnlyRecords = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string,
  targetRepsList: number[]
): RepsOnlyRecord[] => {
  if (!normalizedExerciseName || !workouts?.length || !targetRepsList.length) {
    return [];
  }

  const sortedTargets = [...targetRepsList].sort((a, b) => a - b);
  const results: RepsOnlyRecord[] = [];

  for (const target of sortedTargets) {
    let best: { reps: number; date: string } | null = null;

    for (const workout of workouts) {
      const exercises = (workout.exercises ?? []) as IWorkoutExerciseItem[];

      for (const exercise of exercises) {
        if (
          normalizeForComparison(exercise.name ?? "") !==
          normalizedExerciseName
        ) {
          continue;
        }

        for (const set of (exercise.sets ?? []) as IWorkoutSetItem[]) {
          if (
            typeof set.reps !== "number" ||
            Number.isNaN(set.reps) ||
            set.reps < target
          ) {
            continue;
          }

          if (!best || set.reps > best.reps) {
            best = { reps: set.reps, date: workout.created_at };
          }
        }
      }
    }

    if (!best) {
      results.push({
        targetReps: target,
        bestReps: null,
        date: null,
      });
    } else {
      results.push({
        targetReps: target,
        bestReps: best.reps,
        date: best.date,
      });
    }
  }

  return results;
};

