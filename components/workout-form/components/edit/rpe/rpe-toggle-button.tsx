"use client";

// hooks
import { Control } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

// types
import type { CreateWorkoutFormType } from "@/components/workout-form/types";

interface RpeToggleButtonProps {
  control: Control<CreateWorkoutFormType>;
  exerciseIndex: number;
  setIndex: number;
  rpeOpenBySet: Record<string, boolean>;
  rpeSliderDisplayBySet: Record<string, number>;
  isPending: boolean;
  onToggle: (rpeKey: string, currentValue: number | null | undefined) => void;
}

export const RpeToggleButton = ({
  control,
  exerciseIndex,
  setIndex,
  rpeOpenBySet,
  rpeSliderDisplayBySet: _rpeSliderDisplayBySet,
  isPending,
  onToggle,
}: RpeToggleButtonProps) => (
  <FormField
    control={control}
    name={`exercises.${exerciseIndex}.sets.${setIndex}.rpe`}
    render={({ field }) => {
      const rpeKey = `${exerciseIndex}-${setIndex}`;
      const isRpeOpen = rpeOpenBySet[rpeKey] === true;
      return (
        <FormItem className="shrink-0 mt-6">
          <FormControl>
            <Button
              type="button"
              variant={field.value != null ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                onToggle(rpeKey, field.value as number | null | undefined)
              }
              disabled={isPending}
              aria-expanded={isRpeOpen}
              className="text-xs h-9 w-[3.5rem]"
            >
              {field.value != null ? `RPE ${field.value}` : "RPE"}
            </Button>
          </FormControl>
        </FormItem>
      );
    }}
  />
);
