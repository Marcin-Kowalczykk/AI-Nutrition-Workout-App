"use client";

import { useMemo, useState } from "react";
import { Filter, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import { Loader } from "@/components/shared/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeForComparison } from "@/lib/normalize-string";
import { RecordsFiltersSheet } from "./records-filters-sheet";
import { useListExercises } from "@/components/exercises/api/use-list-exercises";
import type { ExerciseUnitType } from "@/app/api/exercises/types";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  getAllRepsForExercise,
  getBestRecordsByReps,
  getMaxDurationRecord,
  getMaxRepsRecord,
  getMostFrequentReps,
  getMostPopularExerciseName,
} from "./helpers";

export const Records = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedReps, setSelectedReps] = useState<number[]>([]);

  const trimmedExerciseName = selectedExercise?.trim() || "";
  const normalizedExerciseName = trimmedExerciseName
    ? normalizeForComparison(trimmedExerciseName)
    : "";

  const { data, isLoading, error } = useGetWorkoutHistory();

  const workouts = data?.workouts ?? null;

  const { data: exercisesData } = useListExercises();

  const mostPopularExerciseName = useMemo(
    () => getMostPopularExerciseName(workouts),
    [workouts]
  );

  const [hasInitializedExercise, setHasInitializedExercise] = useState(false);

  const hasWorkouts = !!workouts?.length;

  const exerciseUnitType: ExerciseUnitType | null = (() => {
    const exercises = exercisesData?.exercises ?? [];
    if (!trimmedExerciseName) return null;
    const normName = normalizeForComparison(trimmedExerciseName);
    const match =
      exercises.find((exercise: { name: string; unit_type?: ExerciseUnitType }) => {
        const exerciseName = exercise.name ?? "";
        return normalizeForComparison(exerciseName) === normName;
      }) ?? null;

    return (match?.unit_type as ExerciseUnitType | undefined) ?? null;
  })();

  const isRepsOnlyExercise = exerciseUnitType === "reps-only";
  const isTimeBasedExercise = exerciseUnitType === "time-based";
  const isWeightedExercise =
    exerciseUnitType === "weighted" || !exerciseUnitType;

  if (!hasInitializedExercise) {
    if (mostPopularExerciseName && !selectedExercise) {
      setSelectedExercise(mostPopularExerciseName);
      setHasInitializedExercise(true);
    } else if (!isLoading && !hasWorkouts) {
      setHasInitializedExercise(true);
    }
  }

  const isInitializingDefaultExercise =
    !hasInitializedExercise && (isLoading || (!data && !error));

  const allReps = isWeightedExercise
    ? getAllRepsForExercise(workouts, normalizedExerciseName)
    : [];
  const defaultSelectedReps = isWeightedExercise
    ? getMostFrequentReps(workouts, normalizedExerciseName, 5).filter((reps) =>
        allReps.includes(reps)
      )
    : [];

  const effectiveSelectedReps =
    isWeightedExercise && selectedReps.length > 0
      ? selectedReps
      : defaultSelectedReps;

  const bestWeightedRecords = useMemo(
    () =>
      isWeightedExercise
        ? getBestRecordsByReps(
            workouts,
            normalizedExerciseName,
            effectiveSelectedReps
          )
        : [],
    [isWeightedExercise, workouts, normalizedExerciseName, effectiveSelectedReps]
  );

  const maxWeight = useMemo(() => {
    if (!isWeightedExercise || !bestWeightedRecords.length) return null;
    return bestWeightedRecords.reduce(
      (max, record) => (record.weight > max ? record.weight : max),
      bestWeightedRecords[0]?.weight ?? 0
    );
  }, [isWeightedExercise, bestWeightedRecords]);

  const maxRepsRecord = useMemo(
    () =>
      isRepsOnlyExercise
        ? getMaxRepsRecord(workouts, normalizedExerciseName)
        : null,
    [isRepsOnlyExercise, workouts, normalizedExerciseName]
  );

  const maxDurationRecord = useMemo(
    () =>
      isTimeBasedExercise
        ? getMaxDurationRecord(workouts, normalizedExerciseName)
        : null,
    [isTimeBasedExercise, workouts, normalizedExerciseName]
  );

  const handleToggleRep = (reps: number, checked: boolean | string) => {
    const isChecked = checked === true;
    setSelectedReps((prev) => {
      const base =
        prev.length > 0
          ? prev
          : defaultSelectedReps.length > 0
          ? defaultSelectedReps
          : [];

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
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="py-4">
                <span className="inline-block text-sm font-semibold uppercase tracking-wide">
                  {isInitializingDefaultExercise
                    ? "Loading your records..."
                    : error
                    ? "Error loading records"
                    : trimmedExerciseName || "No exercise selected"}
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
              {isInitializingDefaultExercise ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader size={16} />
                  <span>Loading your default exercise and records...</span>
                </p>
              ) : error ? (
                <p className="text-sm text-destructive">
                  Failed to load workout history. You can still select an
                  exercise manually.
                </p>
              ) : !trimmedExerciseName ? (
                <p className="text-sm text-muted-foreground">
                  Select an exercise to see your best historical results.
                </p>
              ) : isRepsOnlyExercise ? (
                maxRepsRecord ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Best result
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-destructive whitespace-nowrap">
                        {maxRepsRecord.reps} reps
                        <Trophy className="h-4 w-4 text-yellow-400" />
                      </span>
                      {maxRepsRecord.date && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(
                            new Date(maxRepsRecord.date),
                            "d MMMM yyyy",
                            { locale: pl }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No record yet 😢
                  </p>
                )
              ) : isTimeBasedExercise ? (
                maxDurationRecord ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Best result
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-destructive whitespace-nowrap">
                        {maxDurationRecord.duration} s
                        <Trophy className="h-4 w-4 text-yellow-400" />
                      </span>
                      {maxDurationRecord.date && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(
                            new Date(maxDurationRecord.date),
                            "d MMMM yyyy",
                            { locale: pl }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No record yet 😢
                  </p>
                )
              ) : (
                <Table className="[&_th]:h-9 [&_th]:px-3 [&_td]:px-3 [&_td]:py-2 text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%] whitespace-nowrap">
                        Reps
                      </TableHead>
                      <TableHead className="w-[40%] text-center whitespace-nowrap">
                        Weight
                      </TableHead>
                      <TableHead className="w-[40%] text-right whitespace-nowrap">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effectiveSelectedReps.map((reps) => {
                      const record = bestWeightedRecords.find(
                        (item) => item.reps === reps
                      );

                      if (!record || !record.weight) {
                        return (
                          <TableRow key={reps} className="whitespace-nowrap">
                            <TableCell className="whitespace-nowrap">
                              {reps} rep{reps !== 1 ? "s" : ""}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                              No record yet 😢
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                              No record yet 😢
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const date = format(
                        new Date(record.date),
                        "d MMMM yyyy",
                        {
                          locale: pl,
                        }
                      );

                      const isBest =
                        maxWeight !== null && record.weight === maxWeight;

                      return (
                        <TableRow key={reps} className="whitespace-nowrap">
                          <TableCell className="whitespace-nowrap">
                            {record.reps} rep{record.reps !== 1 ? "s" : ""}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-destructive whitespace-nowrap">
                            <span className="inline-flex items-center justify-center gap-1 w-full whitespace-nowrap">
                              {record.weight} kg
                              {isBest && (
                                <Trophy className="h-4 w-4 text-yellow-400" />
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                            {date}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
        isRepsOnlyExercise={isRepsOnlyExercise}
        isTimeBasedExercise={isTimeBasedExercise}
        allReps={allReps}
        effectiveSelectedReps={effectiveSelectedReps}
        onToggleRep={handleToggleRep}
      />
    </>
  );
};
