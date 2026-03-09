"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExercisesSelect } from "@/components/shared/exercises-select";
import { Checkbox } from "@/components/ui/checkbox";

interface RecordsFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExercise: string | null;
  onExerciseChange: (name: string) => void;
  trimmedExerciseName: string;
  isLoading: boolean;
  isRepsOnlyExercise: boolean;
  isTimeBasedExercise: boolean;
  allReps: number[];
  effectiveSelectedReps: number[];
  onToggleRep: (reps: number, checked: boolean | string) => void;
}

export const RecordsFiltersSheet = ({
  open,
  onOpenChange,
  selectedExercise,
  onExerciseChange,
  trimmedExerciseName,
  isLoading,
  isRepsOnlyExercise,
  isTimeBasedExercise,
  allReps,
  effectiveSelectedReps,
  onToggleRep,
}: RecordsFiltersSheetProps) => {
  const [portalContainer, setPortalContainer] =
    useState<HTMLElement | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex max-h-full w-full flex-col gap-0 overflow-auto p-0 sm:w-[70%] sm:max-w-[600px]">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="m-0">Records filters</SheetTitle>
        </SheetHeader>

        <div
          ref={(el) => setPortalContainer(el)}
          className="flex-1 overflow-auto px-6 py-6 space-y-6"
        >
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Exercise
            </div>
            <ExercisesSelect
              value={selectedExercise ?? ""}
              onChange={onExerciseChange}
              portalContainer={portalContainer}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isTimeBasedExercise ? "Weight" : "Reps"}
            </div>

            {isRepsOnlyExercise && trimmedExerciseName ? (
              <p className="text-sm text-muted-foreground">
                For this exercise records are based on a single best result. Reps
                filters are not available.
              </p>
            ) : !trimmedExerciseName ? (
              <p className="text-sm text-muted-foreground">
                {isTimeBasedExercise
                  ? "Select an exercise to see all weights you have ever used for it."
                  : "Select an exercise to see all reps you have ever performed for it."}
              </p>
            ) : isLoading && trimmedExerciseName ? (
              <p className="text-sm text-muted-foreground">
                {isTimeBasedExercise
                  ? "Loading weights history..."
                  : "Loading reps history..."}
              </p>
            ) : !isLoading && trimmedExerciseName && allReps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No history found for this exercise yet.
              </p>
            ) : trimmedExerciseName && allReps.length > 0 ? (
              <>
                {allReps.length <= 10 ? (
                  <div className="flex flex-col gap-2">
                    {allReps.map((reps) => (
                      <label
                        key={reps}
                        className="flex items-center gap-2 text-sm cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={effectiveSelectedReps.includes(reps)}
                          onCheckedChange={(checked) =>
                            onToggleRep(reps, checked)
                          }
                        />
                        <span>
                          {reps} {isTimeBasedExercise ? "kg" : "reps"}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6">
                    <div className="flex-1 flex flex-col gap-2">
                      {allReps.slice(0, 10).map((reps) => (
                        <label
                          key={reps}
                          className="flex items-center gap-2 text-sm cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={effectiveSelectedReps.includes(reps)}
                            onCheckedChange={(checked) =>
                              onToggleRep(reps, checked)
                            }
                          />
                          <span>
                            {reps} {isTimeBasedExercise ? "kg" : "reps"}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      {allReps.slice(10).map((reps) => (
                        <label
                          key={reps}
                          className="flex items-center gap-2 text-sm cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={effectiveSelectedReps.includes(reps)}
                            onCheckedChange={(checked) =>
                              onToggleRep(reps, checked)
                            }
                          />
                          <span>
                            {reps} {isTimeBasedExercise ? "kg" : "reps"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

