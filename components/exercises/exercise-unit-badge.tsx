"use client";

import { cn } from "@/lib/utils";
import {
  EXERCISE_UNIT_TYPE,
  type ExerciseUnitType,
} from "@/app/api/exercises/types";

const LABELS: Record<ExerciseUnitType, string> = {
  [EXERCISE_UNIT_TYPE.WEIGHTED]: "Weighted",
  [EXERCISE_UNIT_TYPE.REPS_ONLY]: "Reps only",
  [EXERCISE_UNIT_TYPE.TIME_BASED]: "Time based",
};

const BADGE_CLASS: Record<ExerciseUnitType, string> = {
  [EXERCISE_UNIT_TYPE.WEIGHTED]: "exercise-badge-weighted",
  [EXERCISE_UNIT_TYPE.REPS_ONLY]: "exercise-badge-reps-only",
  [EXERCISE_UNIT_TYPE.TIME_BASED]: "exercise-badge-time-based",
};

interface ExerciseUnitBadgeProps {
  unitType: ExerciseUnitType;
  className?: string;
}

export const ExerciseUnitBadge = ({ unitType, className }: ExerciseUnitBadgeProps) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full border w-24 min-w-24 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-center",
      BADGE_CLASS[unitType],
      className
    )}
  >
    {LABELS[unitType]}
  </span>
);
