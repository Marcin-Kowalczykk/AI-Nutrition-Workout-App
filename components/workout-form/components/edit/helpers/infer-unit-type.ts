import { WORKOUT_UNIT_TYPE, type WorkoutUnitType } from "../../../types";

type SetLike = { weight?: string | number; duration?: string | number };

const hasValue = (v: string | number | undefined | null): boolean => {
  if (v === undefined || v === null) return false;
  if (v === "") return false;
  const num = typeof v === "number" ? v : Number(String(v).trim());
  if (Number.isNaN(num)) return false;
  return num > 0;
};

export const inferUnitType = (sets: SetLike[]): WorkoutUnitType => {
  const hasDuration = (sets ?? []).some((s) => hasValue(s.duration));

  if (hasDuration) return WORKOUT_UNIT_TYPE.DURATION;

  return WORKOUT_UNIT_TYPE.REPS_BASED;
};
