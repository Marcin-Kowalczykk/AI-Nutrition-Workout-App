import type { IWorkoutExerciseItem } from "@/app/api/workouts/types";
import { WORKOUT_UNIT_TYPE } from "@/components/workout-form/types";

export type HistoryUnitColumn =
  | (typeof WORKOUT_UNIT_TYPE)[keyof typeof WORKOUT_UNIT_TYPE]
  | null;

export const getUnitColumn = (
  exercises: IWorkoutExerciseItem[]
): HistoryUnitColumn => {
  const hasDuration = exercises.some((ex) =>
    (ex.sets ?? []).some(
      (s) =>
        s.duration !== undefined &&
        s.duration !== null &&
        s.duration > 0
    )
  );

  const hasWeight = exercises.some((ex) =>
    (ex.sets ?? []).some(
      (s) => s.weight !== undefined && s.weight !== null && s.weight > 0
    )
  );

  // Jeżeli mamy jakiekolwiek Duration > 0, traktujemy historię jako time-based.
  if (hasDuration) return WORKOUT_UNIT_TYPE.DURATION;
  // W przeciwnym razie, jeśli jest ciężar, traktujemy jako reps-based (weight).
  if (hasWeight) return WORKOUT_UNIT_TYPE.REPS_BASED;
  return null;
};
