import {
  WORKOUT_UNIT_TYPE,
  type WorkoutUnitType,
} from "../../../types";

type SetLike = { weight?: number; duration?: number };

export const inferUnitType = (sets: SetLike[]): WorkoutUnitType => {
  const hasWeight = (sets ?? []).some(
    (s) => s.weight !== undefined && s.weight !== null
  );
  const hasDuration = (sets ?? []).some(
    (s) => s.duration !== undefined && s.duration !== null
  );
  if (hasWeight) return WORKOUT_UNIT_TYPE.WEIGHT;
  if (hasDuration) return WORKOUT_UNIT_TYPE.DURATION;
  return WORKOUT_UNIT_TYPE.WEIGHT;
};
