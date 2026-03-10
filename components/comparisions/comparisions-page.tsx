"use client";

import { useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";

import { Card, CardContent } from "../ui/card";
import { ExercisesSelect } from "../shared/exercises-select";
import { DatePicker } from "../shared/date-picker";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import { normalizeForComparison } from "@/lib/normalize-string";
import { filterHistoryByExerciseName } from "@/components/workout-form/components/edit/exercise-history-strip/helpers";
import { ExerciseHistoryWorkoutCard } from "@/components/workout-history/exercise-history-workout-card";
import { Loader } from "@/components/shared/loader";

export const Comparisions = () => {
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const trimmedName = exerciseName?.trim() || "";
  const normalizedExerciseName = trimmedName
    ? normalizeForComparison(trimmedName)
    : "";

  const startDateString = useMemo(() => {
    if (!startDate) return undefined;
    return startOfDay(startDate).toISOString();
  }, [startDate]);

  const endDateString = useMemo(() => {
    if (!endDate) return undefined;
    return endOfDay(endDate).toISOString();
  }, [endDate]);

  const { data, isLoading, isError, error } = useGetWorkoutHistory({
    startDate: startDateString,
    endDate: endDateString,
    enabled: !!normalizedExerciseName,
  });

  const workouts = data?.workouts ?? [];

  const filteredWorkouts = useMemo(
    () => filterHistoryByExerciseName(workouts, normalizedExerciseName),
    [workouts, normalizedExerciseName]
  );

  return (
    <div className="w-full flex flex-col gap-1.5">
      <Card>
        <CardContent className="flex flex-col gap-1 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Exercise</span>
            <ExercisesSelect
              value={exerciseName ?? ""}
              onChange={(value) => setExerciseName(value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Filter by date</span>
            <div className="flex flex-row gap-2 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <DatePicker
                  value={startDate}
                  onChange={(date) => setStartDate(date || undefined)}
                  placeholder="select start date"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <DatePicker
                  value={endDate}
                  onChange={(date) => setEndDate(date || undefined)}
                  placeholder="select end date"
                  disabled={(date) => {
                    const d = startOfDay(date);
                    const today = startOfDay(new Date());
                    if (d > today) return true;
                    if (startDate) return d < startOfDay(startDate);
                    return false;
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex flex-col gap-1">
        {!normalizedExerciseName && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">
                Select an exercise to see all historical workouts that include
                it.
              </p>
            </CardContent>
          </Card>
        )}

        {normalizedExerciseName && isLoading && (
          <Card>
            <CardContent className="py-6 flex items-center justify-center">
              <Loader />
            </CardContent>
          </Card>
        )}

        {normalizedExerciseName && isError && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-primary-element">
                {error?.message || "Failed to load history"}
              </p>
            </CardContent>
          </Card>
        )}

        {normalizedExerciseName &&
          !isLoading &&
          !isError &&
          filteredWorkouts.length === 0 && (
            <Card>
              <CardContent className="py-3">
                <p className="text-sm text-muted-foreground">
                  No workouts found for this exercise in the selected date
                  range.
                </p>
              </CardContent>
            </Card>
          )}

        {normalizedExerciseName &&
          !isLoading &&
          !isError &&
          filteredWorkouts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {filteredWorkouts.map((workout) => (
                <ExerciseHistoryWorkoutCard
                  key={workout.id}
                  workout={workout}
                  normalizedExerciseName={normalizedExerciseName}
                  variant="full"
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
};
