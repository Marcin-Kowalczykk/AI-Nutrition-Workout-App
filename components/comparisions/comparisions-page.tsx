"use client";

import { useMemo, useState } from "react";
import { endOfDay, startOfDay, subMonths } from "date-fns";

import { Card, CardContent } from "../ui/card";
import { ExercisesSelect } from "../shared/exercises-select";
import { DatePicker } from "../shared/date-picker";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import { normalizeForComparison } from "@/lib/normalize-string";
import { filterHistoryByExerciseName } from "@/components/workout-form/components/edit/exercise-history-strip/helpers";
import { ExerciseHistoryWorkoutCard } from "@/components/workout-history/exercise-history-workout-card";
import { Loader } from "@/components/shared/loader";
import { ExerciseHistoryBarChart } from "@/components/comparisions/exercise-history-bar-chart";
import {
  ChartConfigModal,
  type ChartConfigState,
} from "@/components/comparisions/chart-config-modal";
import { ExerciseUnitType } from "@/app/api/exercises/types";
import type { IWorkoutItem } from "@/app/api/workouts/types";
import { Button } from "@/components/ui/button";
import { useIsMobileLandscape } from "@/components/comparisions/hooks/use-is-mobile-landscape";
import { FullscreenExerciseHistoryChart } from "@/components/comparisions/fullscreen-exercise-history-chart";
import { getMostPopularExerciseName } from "@/lib/get-most-popular-exercise-name";
import { useListExercises } from "@/components/exercises/api/use-list-exercises";
import { toast } from "sonner";
import { PaginatedSection } from "../shared/pagination/paginated-section";
import { buildChartData } from "@/components/comparisions/helpers/build-chart-data";

//types
export type { HistoryPoint, HistoryPointSetInfo } from "@/components/comparisions/helpers/build-chart-data";

export const Comparisions = () => {
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    subMonths(new Date(), 6)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [chartConfigOpen, setChartConfigOpen] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfigState | null>(null);
  const isMobileLandscape = useIsMobileLandscape();
  const [hasInitializedExercise, setHasInitializedExercise] = useState(false);
  const { data: exercisesData } = useListExercises();

  const trimmedName = exerciseName?.trim() || "";
  const normalizedExerciseName = trimmedName
    ? normalizeForComparison(trimmedName)
    : "";

  const selectedUnitType: ExerciseUnitType | undefined = useMemo(() => {
    const exercises = exercisesData?.exercises ?? [];
    if (!trimmedName) return undefined;
    const normName = normalizeForComparison(trimmedName);
    const match =
      exercises.find(
        (exercise: { name: string; unit_type?: ExerciseUnitType }) => {
          const exerciseName = exercise.name ?? "";
          return normalizeForComparison(exerciseName) === normName;
        }
      ) ?? null;

    return (match?.unit_type as ExerciseUnitType | undefined) ?? undefined;
  }, [exercisesData?.exercises, trimmedName]);

  const startDateString = useMemo(() => {
    if (!startDate) return undefined;
    return startOfDay(startDate).toISOString();
  }, [startDate]);

  const endDateString = useMemo(() => {
    if (!endDate) return undefined;
    return endOfDay(endDate).toISOString();
  }, [endDate]);

  const {
    data: filteredHistoryData,
    isLoading,
    isError,
    error,
  } = useGetWorkoutHistory({
    startDate: startDateString,
    endDate: endDateString,
    enabled: !!normalizedExerciseName,
  });

  const { data: allHistoryData, isLoading: isAllHistoryLoading } =
    useGetWorkoutHistory();

  const allWorkouts = allHistoryData?.workouts ?? null;

  const mostPopularExerciseName = useMemo(
    () => getMostPopularExerciseName(allWorkouts),
    [allWorkouts]
  );

  if (!hasInitializedExercise) {
    if (mostPopularExerciseName && !exerciseName) {
      setExerciseName(mostPopularExerciseName);
      setHasInitializedExercise(true);
    } else if (!isAllHistoryLoading && !allWorkouts?.length) {
      setHasInitializedExercise(true);
    }
  }

  const filteredWorkouts = useMemo(
    () =>
      filterHistoryByExerciseName(
        filteredHistoryData?.workouts ?? null,
        normalizedExerciseName
      ),
    [filteredHistoryData?.workouts, normalizedExerciseName]
  );

  const showRpe = useMemo(
    () =>
      filteredWorkouts.some((w) =>
        (w.exercises ?? []).some((ex) =>
          (ex.sets ?? []).some((s) => s.rpe != null)
        )
      ),
    [filteredWorkouts]
  );

  const { points: chartPoints, yLabel } = useMemo(
    () =>
      buildChartData(
        (filteredWorkouts as IWorkoutItem[]) ?? [],
        normalizedExerciseName,
        selectedUnitType,
        chartConfig
      ),
    [filteredWorkouts, normalizedExerciseName, selectedUnitType, chartConfig]
  );

  const showFullscreenChart =
    isMobileLandscape &&
    !!normalizedExerciseName &&
    chartPoints.length > 0 &&
    !!yLabel;
  return (
    <>
      <FullscreenExerciseHistoryChart
        open={showFullscreenChart}
        data={chartPoints}
        yLabel={yLabel ?? ""}
      />
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex flex-col gap-1 px-0.5 py-0.5 sm:px-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Exercise</span>
            <ExercisesSelect
              value={exerciseName ?? ""}
              onChange={(value) => setExerciseName(value)}
              onExerciseSelectedMeta={() => {
                setChartConfig(null);
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Filter by date</span>
            <div className="flex flex-row gap-1.5 flex-wrap">
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

          {normalizedExerciseName && (
            <Button
              type="button"
              size="sm"
              variant="default"
              className="mt-1"
              onClick={() => setChartConfigOpen(true)}
            >
              Configure chart
            </Button>
          )}
        </div>

        {normalizedExerciseName && chartPoints.length > 0 && yLabel && (
          <Card>
            <CardContent className="pt-3">
              <ExerciseHistoryBarChart data={chartPoints} yLabel={yLabel} />
            </CardContent>
          </Card>
        )}

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
              <PaginatedSection
                items={filteredWorkouts}
                initialPageSize={8}
                pageSizeOptions={[8, 15, 20, 30, 50]}
                className="flex flex-col gap-1.5"
                controlsWrapperClassName="mb-1"
              >
                {(paginated) => (
                  <div className="flex flex-col gap-1.5">
                    {paginated.map((workout) => (
                      <ExerciseHistoryWorkoutCard
                        key={workout.id}
                        workout={workout}
                        normalizedExerciseName={normalizedExerciseName}
                        variant="full"
                        showRpe={showRpe}
                      />
                    ))}
                  </div>
                )}
              </PaginatedSection>
            )}
        </div>

        <ChartConfigModal
          key={`${normalizedExerciseName || "none"}-${
            selectedUnitType ?? "unknown"
          }`}
          open={chartConfigOpen && !!normalizedExerciseName}
          onOpenChange={setChartConfigOpen}
          unitType={selectedUnitType}
          value={chartConfig}
          onSave={(next) => {
            const { points } = buildChartData(
              (filteredWorkouts as IWorkoutItem[]) ?? [],
              normalizedExerciseName,
              selectedUnitType,
              next
            );

            if (filteredWorkouts.length > 0 && points.length === 0) {
              toast.warning("There are no results for your choices.");
            }

            setChartConfig(next);
          }}
        />
      </div>
    </>
  );
};
