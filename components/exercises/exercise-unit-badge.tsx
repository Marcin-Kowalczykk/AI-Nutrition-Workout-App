"use client";

import { cn } from "@/lib/utils";
import {
  EXERCISE_UNIT_TYPE,
  type ExerciseUnitType,
} from "@/app/api/exercises/types";

const LABELS: Record<ExerciseUnitType, string> = {
  [EXERCISE_UNIT_TYPE.REPS_BASED]: "Reps based",
  [EXERCISE_UNIT_TYPE.TIME_BASED]: "Time based",
};

const BADGE_CLASS: Record<ExerciseUnitType, string> = {
  [EXERCISE_UNIT_TYPE.REPS_BASED]: "exercise-badge-reps-based",
  [EXERCISE_UNIT_TYPE.TIME_BASED]: "exercise-badge-time-based",
};

interface ExerciseUnitBadgeProps {
  unitType: ExerciseUnitType;
  className?: string;
}

export const ExerciseUnitBadge = ({
  unitType,
  className,
}: ExerciseUnitBadgeProps) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full border w-18 min-w-16 h-5 px-1 text-[8px] font-medium uppercase tracking-wide text-center leading-none",
      BADGE_CLASS[unitType],
      className
    )}
  >
    {LABELS[unitType]}
  </span>
);
