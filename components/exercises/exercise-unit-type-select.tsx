"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  EXERCISE_UNIT_TYPE,
  type ExerciseUnitType,
} from "@/app/api/exercises/types";
import { ExerciseUnitBadge } from "./exercise-unit-badge";

const UNIT_TYPES = [
  EXERCISE_UNIT_TYPE.WEIGHTED,
  EXERCISE_UNIT_TYPE.REPS_ONLY,
  EXERCISE_UNIT_TYPE.TIME_BASED,
] as const;

interface ExerciseUnitTypeSelectProps {
  value: ExerciseUnitType | "";
  onChange: (value: ExerciseUnitType) => void;
  disabled?: boolean;
  className?: string;
}

export const ExerciseUnitTypeSelect = ({
  value,
  onChange,
  disabled,
  className,
}: ExerciseUnitTypeSelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 flex-1 min-w-0 justify-between font-normal",
            className
          )}
        >
          <span className="truncate flex items-center min-w-0">
            {value ? (
              <ExerciseUnitBadge unitType={value} />
            ) : (
              <span className="text-muted-foreground">Select unit type</span>
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {UNIT_TYPES.map((unitValue) => (
          <button
            key={unitValue}
            type="button"
            onClick={() => {
              onChange(unitValue);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-left text-sm focus:outline-none focus:ring-1 focus:ring-ring",
              value === unitValue
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-accent/80 hover:text-accent-foreground"
            )}
          >
            <ExerciseUnitBadge unitType={unitValue} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
