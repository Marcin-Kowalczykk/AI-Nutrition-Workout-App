export interface IExerciseCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export const EXERCISE_UNIT_TYPE = {
  REPS_BASED: "reps-based",
  TIME_BASED: "time-based",
} as const;

export type ExerciseUnitType =
  (typeof EXERCISE_UNIT_TYPE)[keyof typeof EXERCISE_UNIT_TYPE];

export interface IExercise {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string;
  unit_type: ExerciseUnitType;
}
