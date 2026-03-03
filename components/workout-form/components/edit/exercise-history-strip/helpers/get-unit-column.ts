import type { IWorkoutExerciseItem } from "@/app/api/workouts/types";
import { WORKOUT_UNIT_TYPE } from "@/components/workout-form/types";

export type HistoryUnitColumn =
  | (typeof WORKOUT_UNIT_TYPE)[keyof typeof WORKOUT_UNIT_TYPE]
  | null;

export const getUnitColumn = (
  exercises: IWorkoutExerciseItem[]
): HistoryUnitColumn => {
  const hasWeight = exercises.some((ex) =>
    (ex.sets ?? []).some((s) => s.weight !== undefined && s.weight !== null)
  );

  const hasDuration = exercises.some((ex) =>
    (ex.sets ?? []).some(
      (s) =>
        s.duration !== undefined &&
        s.duration !== null &&
        s.duration > 0
    )
  );

  if (hasWeight) return WORKOUT_UNIT_TYPE.WEIGHT;
  if (hasDuration) return WORKOUT_UNIT_TYPE.DURATION;
  return null;
};

