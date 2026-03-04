"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import { normalizeForComparison } from "@/lib/normalize-string";
import { RecordsFiltersSheet } from "./records-filters-sheet";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  getAllRepsForExercise,
  getBestRecordsByReps,
  getMostFrequentReps,
} from "./records-helpers";

export const Records = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedReps, setSelectedReps] = useState<number[]>([]);

  const trimmedExerciseName = selectedExercise?.trim() || "";
  const normalizedExerciseName = trimmedExerciseName
    ? normalizeForComparison(trimmedExerciseName)
    : "";

  const { data, isLoading } = useGetWorkoutHistory({
    enabled: !!normalizedExerciseName && isFiltersOpen,
  });

  const allReps = getAllRepsForExercise(
    data?.workouts ?? null,
    normalizedExerciseName
  );
  const defaultSelectedReps = getMostFrequentReps(
    data?.workouts ?? null,
    normalizedExerciseName,
    5
  ).filter((reps) => allReps.includes(reps));

  const effectiveSelectedReps =
    selectedReps.length > 0 ? selectedReps : defaultSelectedReps;

  const bestRecords = getBestRecordsByReps(
    data?.workouts ?? null,
    normalizedExerciseName,
    effectiveSelectedReps
  );

  const handleToggleRep = (reps: number, checked: boolean | string) => {
    const isChecked = checked === true;
    setSelectedReps((prev) => {
      const base =
        prev.length > 0 ? prev : defaultSelectedReps.length > 0 ? defaultSelectedReps : [];

      if (isChecked) {
        if (base.includes(reps)) return base;
        return [...base, reps].sort((a, b) => a - b);
      }
      return base.filter((value) => value !== reps);
    });
  };

  const handleExerciseChange = (name: string) => {
    setSelectedExercise(name);
    setSelectedReps([]);
  };

  return (
    <>
      <div className="w-full xl:w-1/2">
        <Card>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="py-1 text-sm">
                <span className="inline-block text-xs font-semibold uppercase tracking-wide">
                  {trimmedExerciseName || "No exercise selected"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsFiltersOpen(true)}
                aria-label="Open records filters"
                className="mt-0.5"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Best historical results
              </div>

              {!trimmedExerciseName || effectiveSelectedReps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select an exercise and at least one reps filter to see your
                  best historical results.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {effectiveSelectedReps.map((reps) => {
                    const record = bestRecords.find(
                      (item) => item.reps === reps
                    );

                    if (!record) {
                      return (
                        <li
                          key={reps}
                          className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5"
                        >
                          <div className="w-20 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {reps} rep{reps !== 1 ? "s" : ""}
                          </div>
                          <div className="flex-1 flex justify-center">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              There is no record bro 😢
                            </span>
                          </div>
                          <div className="w-32 text-xs text-muted-foreground text-right">
                            Future
                          </div>
                        </li>
                      );
                    }

                    const date = format(new Date(record.date), "d MMMM yyyy", {
                      locale: pl,
                    });

                    return (
                      <li
                        key={reps}
                        className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5"
                      >
                        <div className="w-20 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {record.reps} rep{record.reps !== 1 ? "s" : ""}
                        </div>
                        <div className="flex-1 flex justify-center">
                          <span className="text-lg font-semibold text-destructive">
                            {record.weight} kg
                          </span>
                        </div>
                        <div className="w-32 text-xs text-muted-foreground text-right">
                          <span className="block">{date}</span>
                          <span className="block truncate max-w-[200px]">
                            {record.workoutName}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <RecordsFiltersSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        selectedExercise={selectedExercise}
        onExerciseChange={handleExerciseChange}
        trimmedExerciseName={trimmedExerciseName}
        isLoading={isLoading}
        allReps={allReps}
        effectiveSelectedReps={effectiveSelectedReps}
        onToggleRep={handleToggleRep}
      />
    </>
  );
};
