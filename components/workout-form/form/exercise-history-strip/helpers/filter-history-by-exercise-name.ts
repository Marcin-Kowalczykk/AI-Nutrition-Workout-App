//libs
import { normalizeForComparison } from "@/lib/normalize-string";

//types
import type {
  IWorkoutExerciseItem,
  IWorkoutItem,
} from "@/app/api/workouts/types";

export const filterHistoryByExerciseName = (
  workouts: IWorkoutItem[] | null | undefined,
  normalizedExerciseName: string,
  maxWorkouts?: number
): IWorkoutItem[] => {
  if (!normalizedExerciseName || !workouts?.length) return [];

  const withExercise = workouts.filter((workout) =>
    (workout.exercises ?? []).some(
      (exercise: IWorkoutExerciseItem) =>
        normalizeForComparison(exercise.name ?? "") === normalizedExerciseName
    )
  );

  if (!maxWorkouts || maxWorkouts <= 0) {
    return withExercise;
  }

  return withExercise.slice(0, maxWorkouts);
};
