"use client";

import { useEffect, useMemo, useState } from "react";
import { endOfDay, format, startOfDay, subMonths } from "date-fns";
import { pl } from "date-fns/locale";

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
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";
import { Button } from "@/components/ui/button";

export type HistoryPointSetInfo = {
  reps: number;
  weight: number;
  duration: number;
};

export type HistoryPoint = {
  dateLabel: string;
  value: number; // max na słupku
  sets: HistoryPointSetInfo[]; // wszystkie serie, które się liczą do wykresu
};

const useIsMobileLandscape = () => {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      const { innerWidth, innerHeight } = window;
      const isLandscape = innerWidth > innerHeight;
      const isMobile = innerWidth < 1024;
      setIsMobileLandscape(isLandscape && isMobile);
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobileLandscape;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(String(value));
  if (Number.isNaN(num)) return null;
  return num;
};

const buildChartData = (
  workouts: IWorkoutItem[],
  normalizedExerciseName: string,
  unitType: ExerciseUnitType | undefined,
  config: ChartConfigState | null
): { points: HistoryPoint[]; yLabel: string | null } => {
  if (!normalizedExerciseName || !config) {
    return { points: [], yLabel: null };
  }

  const isTimeBased = unitType === "time-based";
  const points: { date: Date; value: number; sets: HistoryPointSetInfo[] }[] =
    [];

  for (const workout of workouts) {
    if (!workout.created_at) continue;

    const exercises =
      (workout.exercises ?? []).filter(
        (ex: IWorkoutExerciseItem) =>
          normalizeForComparison(ex.name ?? "") === normalizedExerciseName
      ) ?? [];

    if (!exercises.length) continue;

    let valueForWorkout: number | null = null;
    const matchingSets: HistoryPointSetInfo[] = [];

    if (isTimeBased) {
      // time-based: duration vs time, opcjonalnie filtrowane po weight
      const bodyweight = config.bodyweightOnly;
      const targetWeight = bodyweight ? null : toNumber(config.weightTarget);

      for (const ex of exercises) {
        for (const set of ex.sets ?? []) {
          const weight = toNumber((set as IWorkoutSetItem).weight) ?? 0;
          const duration = toNumber((set as IWorkoutSetItem).duration);
          const reps = toNumber((set as IWorkoutSetItem).reps) ?? 0;
          if (duration === null || duration <= 0) continue;
          if (bodyweight) {
            if (weight !== 0) continue;
          } else if (targetWeight !== null && weight !== targetWeight) {
            continue;
          }

          matchingSets.push({ reps, weight, duration });

          valueForWorkout =
            valueForWorkout === null
              ? duration
              : Math.max(valueForWorkout, duration);
        }
      }
    } else {
      // reps-based
      if (config.mode === "reps_only") {
        // wykres reps w czasie dla bodyweight (weight = 0)
        for (const ex of exercises) {
          for (const set of ex.sets ?? []) {
            const weight = toNumber((set as IWorkoutSetItem).weight) ?? 0;
            const reps = toNumber((set as IWorkoutSetItem).reps);
            const duration = toNumber((set as IWorkoutSetItem).duration) ?? 0;
            if (reps === null || reps <= 0) continue;
            if (weight !== 0) continue;

            matchingSets.push({ reps, weight, duration });

            valueForWorkout =
              valueForWorkout === null ? reps : Math.max(valueForWorkout, reps);
          }
        }
      } else {
        // wykres weight w czasie dla konkretnych reps:
        // bierzemy wszystkie serie z daną liczbą powtórzeń i dodatnim ciężarem
        const repsTarget = toNumber(config.repsTarget);
        if (repsTarget === null || repsTarget <= 0) {
          continue;
        }

        for (const ex of exercises) {
          for (const set of ex.sets ?? []) {
            const reps = toNumber((set as IWorkoutSetItem).reps);
            const weight = toNumber((set as IWorkoutSetItem).weight) ?? 0;
            const duration = toNumber((set as IWorkoutSetItem).duration) ?? 0;
            if (reps !== repsTarget) continue;
            if (weight <= 0) continue;

            matchingSets.push({
              reps: reps ?? 0,
              weight,
              duration,
            });

            valueForWorkout =
              valueForWorkout === null
                ? weight
                : Math.max(valueForWorkout, weight);
          }
        }
      }
    }

    if (valueForWorkout !== null && matchingSets.length > 0) {
      const date = new Date(workout.created_at);
      points.push({ date, value: valueForWorkout, sets: matchingSets });
    }
  }

  // sortowanie po dacie rosnąco
  points.sort((a, b) => a.date.getTime() - b.date.getTime());

  const historyPoints: HistoryPoint[] = points.map(({ date, value, sets }) => ({
    dateLabel: format(date, "d MMM yyyy", { locale: pl }),
    value,
    sets,
  }));

  let yLabel: string | null = null;
  if (isTimeBased) {
    yLabel = "Duration [s]";
  } else if (config.mode === "reps_only") {
    yLabel = "Reps";
  } else {
    yLabel = "Weight [kg]";
  }

  return { points: historyPoints, yLabel };
};

export const Comparisions = () => {
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    subMonths(new Date(), 6)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [selectedUnitType, setSelectedUnitType] = useState<
    ExerciseUnitType | undefined
  >(undefined);
  const [chartConfigOpen, setChartConfigOpen] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfigState | null>(null);
  const isMobileLandscape = useIsMobileLandscape();

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

  const filteredWorkouts = useMemo(
    () =>
      filterHistoryByExerciseName(
        data?.workouts ?? null,
        normalizedExerciseName
      ),
    [data?.workouts, normalizedExerciseName]
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
    normalizedExerciseName &&
    chartPoints.length > 0 &&
    !!yLabel;

  return (
    <>
      {showFullscreenChart && (
        <div className="fixed inset-0 z-50 bg-background px-2 pt-4 pb-2">
          <ExerciseHistoryBarChart data={chartPoints} yLabel={yLabel} />
        </div>
      )}
      <div className="w-full flex flex-col gap-1.5">
      <Card>
        <CardContent className="flex flex-col gap-1 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Exercise</span>
            <ExercisesSelect
              value={exerciseName ?? ""}
              onChange={(value) => setExerciseName(value)}
              onExerciseSelectedMeta={(meta) => {
                setSelectedUnitType(meta.unitType);
                setChartConfig(null);
              }}
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
        </CardContent>
      </Card>

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

        <ChartConfigModal
          open={chartConfigOpen && !!normalizedExerciseName}
          onOpenChange={setChartConfigOpen}
          unitType={selectedUnitType}
          value={chartConfig}
          onSave={(next) => setChartConfig(next)}
        />
      </div>
    </>
  );
};
