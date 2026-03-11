import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
} from "@/app/api/workouts/types";

export const getMostPopularExerciseName = (
  workouts: IWorkoutItem[] | null | undefined
): string | null => {
  if (!workouts?.length) {
    return null;
  }

  const counts = new Map<
    string,
    {
      count: number;
      displayName: string;
    }
  >();

  for (const workout of workouts) {
    const exercises = (workout.exercises ?? []) as IWorkoutExerciseItem[];

    for (const exercise of exercises) {
      const rawName = exercise.name ?? "";
      const normalizedName = normalizeForComparison(rawName);

      if (!normalizedName) {
        continue;
      }

      const existing = counts.get(normalizedName);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(normalizedName, {
          count: 1,
          displayName: rawName,
        });
      }
    }
  }

  if (counts.size === 0) {
    return null;
  }

  const best = Array.from(counts.entries()).reduce<{
    normalizedName: string;
    count: number;
    displayName: string;
  } | null>((bestSoFar, [normalizedName, info]) => {
    if (!bestSoFar) {
      return { normalizedName, count: info.count, displayName: info.displayName };
    }

    if (info.count > bestSoFar.count) {
      return { normalizedName, count: info.count, displayName: info.displayName };
    }

    if (info.count < bestSoFar.count) {
      return bestSoFar;
    }

    if (info.displayName.localeCompare(bestSoFar.displayName) < 0) {
      return { normalizedName, count: info.count, displayName: info.displayName };
    }

    return bestSoFar;
  }, null);

  return best?.displayName ?? null;
};

