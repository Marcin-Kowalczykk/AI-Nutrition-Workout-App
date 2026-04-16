"use client";

// components
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

// types
import type { Control } from "react-hook-form";
import type { CreateWorkoutFormType } from "@/components/workout-form/types";

interface RpeToggleButtonProps {
  control: Control<CreateWorkoutFormType>;
  exerciseIndex: number;
  setIndex: number;
  rpeOpenBySet: Record<string, boolean>;
  isPending: boolean;
  onToggle: (rpeKey: string, currentValue: number | null | undefined) => void;
}

export const RpeToggleButton = ({
  control,
  exerciseIndex,
  setIndex,
  rpeOpenBySet,
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
        <FormItem className="shrink-0 mt-4">
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
              className="h-7 shrink-0 px-2 text-[10px] font-bold"
            >
              {field.value != null ? `RPE ${field.value}` : "RPE"}
            </Button>
          </FormControl>
        </FormItem>
      );
    }}
  />
);
