"use client";

import { cn } from "@/lib/utils";
import {
  EXERCISE_UNIT_TYPE,
  type ExerciseUnitType,
} from "@/app/api/exercises/types";
import { ExerciseUnitBadge } from "./exercise-unit-badge";

const UNIT_TYPES: ExerciseUnitType[] = [
  EXERCISE_UNIT_TYPE.WEIGHTED,
  EXERCISE_UNIT_TYPE.REPS_ONLY,
  EXERCISE_UNIT_TYPE.TIME_BASED,
];

interface ExerciseUnitTypeButtonsProps {
  value: ExerciseUnitType | "";
  onChange: (value: ExerciseUnitType) => void;
  disabled?: boolean;
  className?: string;
}

export const ExerciseUnitTypeButtons = ({
  value,
  onChange,
  disabled,
  className,
}: ExerciseUnitTypeButtonsProps) => (
  <div className={cn("flex items-center gap-2 flex-wrap", className)}>
    {UNIT_TYPES.map((unitValue) => {
      const isSelected = value === unitValue;
      return (
        <button
          key={unitValue}
          type="button"
          disabled={disabled}
          onClick={() => onChange(unitValue)}
          className="rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ExerciseUnitBadge
            unitType={unitValue}
            className={cn(
              isSelected &&
                "border-2 brightness-125 saturate-150"
            )}
          />
        </button>
      );
    })}
  </div>
);
