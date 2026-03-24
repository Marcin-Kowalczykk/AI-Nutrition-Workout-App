"use client";

import { useMemo, useState } from "react";
import { Filter, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import { Loader } from "@/components/shared/loader";
import { normalizeForComparison } from "@/lib/normalize-string";
import { RecordsFiltersSheet } from "./records-filters-sheet";
import { useListExercises } from "@/components/exercises/api/use-list-exercises";
import type { ExerciseUnitType } from "@/app/api/exercises/types";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  getAllRepsForExercise,
  getAllWeightsForExercise,
  getBestRecordsByReps,
  getBestDurationByWeight,
  getMaxDurationRecord,
  getMaxRepsRecord,
  getMostFrequentReps,
  getMostPopularExerciseName,
} from "./helpers";
import { MaxRecordTable, RecordsTableSection } from "./records-tables";

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
      exercises.find(
        (exercise: { name: string; unit_type?: ExerciseUnitType }) => {
          const exerciseName = exercise.name ?? "";
          return normalizeForComparison(exerciseName) === normName;
        }
      ) ?? null;

    return (match?.unit_type as ExerciseUnitType | undefined) ?? null;
  })();

  const isRepsOnlyExercise = false;
  const isTimeBasedExercise = exerciseUnitType === "time-based";
  const isRepsBasedExercise =
    exerciseUnitType === "reps-based" || !exerciseUnitType;

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

  const allReps = isRepsBasedExercise
    ? getAllRepsForExercise(workouts, normalizedExerciseName)
    : isTimeBasedExercise
    ? getAllWeightsForExercise(workouts, normalizedExerciseName)
    : [];

  const defaultSelectedReps = isRepsBasedExercise
    ? getMostFrequentReps(workouts, normalizedExerciseName, 5).filter((reps) =>
        allReps.includes(reps)
      )
    : isTimeBasedExercise
    ? allReps
    : [];

  const effectiveSelectedReps =
    selectedReps.length > 0 ? selectedReps : defaultSelectedReps;

  const bestWeightedRecords = useMemo(
    () =>
      isRepsBasedExercise
        ? getBestRecordsByReps(
            workouts,
            normalizedExerciseName,
            effectiveSelectedReps
          )
        : [],
    [
      isRepsBasedExercise,
      workouts,
      normalizedExerciseName,
      effectiveSelectedReps,
    ]
  );

  const maxWeight = useMemo(() => {
    if (!isRepsBasedExercise || !bestWeightedRecords.length) return null;
    return bestWeightedRecords.reduce(
      (max, record) => (record.weight > max ? record.weight : max),
      bestWeightedRecords[0]?.weight ?? 0
    );
  }, [isRepsBasedExercise, bestWeightedRecords]);

  const maxRepsRecord = useMemo(
    () =>
      isRepsBasedExercise
        ? getMaxRepsRecord(workouts, normalizedExerciseName)
        : null,
    [isRepsBasedExercise, workouts, normalizedExerciseName]
  );

  const maxDurationRecord = useMemo(
    () =>
      isTimeBasedExercise
        ? getMaxDurationRecord(workouts, normalizedExerciseName)
        : null,
    [isTimeBasedExercise, workouts, normalizedExerciseName]
  );

  const bestDurationByWeight = useMemo(() => {
    if (!isTimeBasedExercise) return [];
    const all = getBestDurationByWeight(workouts, normalizedExerciseName);
    if (!effectiveSelectedReps.length) return all;
    const selectedSet = new Set(effectiveSelectedReps);
    return all.filter((record) => selectedSet.has(record.weight));
  }, [
    isTimeBasedExercise,
    workouts,
    normalizedExerciseName,
    effectiveSelectedReps,
  ]);

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

  const renderRecordsContent = () => {
    if (isInitializingDefaultExercise) {
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader size={16} />
          <span>Loading your default exercise and records...</span>
        </p>
      );
    }
    if (error) {
      return (
        <p className="text-sm text-destructive">
          Failed to load workout history. You can still select an exercise
          manually.
        </p>
      );
    }
    if (!trimmedExerciseName) {
      return (
        <p className="text-sm text-muted-foreground">
          Select an exercise to see your best historical results.
        </p>
      );
    }
    if (isTimeBasedExercise) {
      if (!maxDurationRecord && bestDurationByWeight.length === 0) {
        return (
          <p className="text-sm text-muted-foreground">No record yet 😢</p>
        );
      }

      return (
        <div className="space-y-3">
          {maxDurationRecord && (
            <MaxRecordTable
              title="Time record"
              value={
                <>
                  {maxDurationRecord.duration} s
                  {maxDurationRecord.weight !== null &&
                    maxDurationRecord.weight > 0 && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({maxDurationRecord.weight} kg)
                      </span>
                    )}
                </>
              }
              date={
                maxDurationRecord.date
                  ? format(new Date(maxDurationRecord.date), "d MMMM yyyy", {
                      locale: pl,
                    })
                  : null
              }
            />
          )}

          {bestDurationByWeight.length > 0 && (
            <RecordsTableSection
              title="Weight records"
              firstHeader="Weight"
              secondHeader="Duration"
              rows={bestDurationByWeight.map((record) => ({
                key: record.weight,
                first: `${record.weight} kg`,
                second: (
                  <span className="inline-flex items-center justify-start gap-1 font-bold border-b-2 border-primary-element whitespace-nowrap py-1">
                    {record.duration} s
                  </span>
                ),
                date: format(new Date(record.date), "d MMMM yyyy", {
                  locale: pl,
                }),
              }))}
            />
          )}
        </div>
      );
    }
    if (bestWeightedRecords.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No history for this exercise yet.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {maxRepsRecord && (
          <MaxRecordTable
            title="Reps record"
            value={
              <>
                {maxRepsRecord.reps} reps
                {maxRepsRecord.weight !== null &&
                  maxRepsRecord.weight > 0 && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({maxRepsRecord.weight} kg)
                    </span>
                  )}
              </>
            }
            date={
              maxRepsRecord.date
                ? format(new Date(maxRepsRecord.date), "d MMMM yyyy", {
                    locale: pl,
                  })
                : null
            }
          />
        )}

        <RecordsTableSection
          title="Weight records"
          firstHeader="Reps"
          secondHeader="Weight"
          rows={effectiveSelectedReps.map((reps) => {
            const record = bestWeightedRecords.find(
              (item) => item.reps === reps
            );

            if (!record || !record.weight) {
              return {
                key: reps,
                first: (
                  <>
                    {reps} rep{reps !== 1 ? "s" : ""}
                  </>
                ),
                second: (
                  <span className="text-muted-foreground">
                    No record yet 😢
                  </span>
                ),
                date: "",
              };
            }

            const isBest = maxWeight !== null && record.weight === maxWeight;

            return {
              key: reps,
              first: (
                <>
                  {record.reps} rep{record.reps !== 1 ? "s" : ""}
                </>
              ),
              second: (
                <span className="inline-flex items-center justify-center gap-1 w-15 font-bold border-b-2 border-primary-element whitespace-nowrap py-1">
                  {record.weight} kg
                  {isBest && <Trophy className="h-4 w-4 text-yellow-400" />}
                </span>
              ),
              date: format(new Date(record.date), "d MMMM yyyy", {
                locale: pl,
              }),
            };
          })}
        />
      </div>
    );
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

            <div className="space-y-2">{renderRecordsContent()}</div>
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
