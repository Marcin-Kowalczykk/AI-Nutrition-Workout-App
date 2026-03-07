import {
  WORKOUT_UNIT_TYPE,
  type WorkoutUnitType,
} from "../../../types";

type SetLike = { weight?: string | number; duration?: string | number };

const hasValue = (v: string | number | undefined | null): boolean =>
  v !== undefined && v !== null && v !== "";

export const inferUnitType = (sets: SetLike[]): WorkoutUnitType => {
  const hasWeight = (sets ?? []).some((s) => hasValue(s.weight));
  const hasDuration = (sets ?? []).some((s) => hasValue(s.duration));
  if (hasWeight) return WORKOUT_UNIT_TYPE.WEIGHT;
  if (hasDuration) return WORKOUT_UNIT_TYPE.DURATION;
  return WORKOUT_UNIT_TYPE.REPS_ONLY;
};
