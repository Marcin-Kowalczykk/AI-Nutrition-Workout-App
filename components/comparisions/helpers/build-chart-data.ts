import { format } from "date-fns";
import { pl } from "date-fns/locale";

//libs
import { normalizeForComparison } from "@/lib/normalize-string";

//types
import type { ExerciseUnitType } from "@/app/api/exercises/types";
import type {
  IWorkoutItem,
  IWorkoutExerciseItem,
  IWorkoutSetItem,
} from "@/app/api/workouts/types";
import type { ChartConfigState } from "@/components/comparisions/chart-config-modal";

export type HistoryPointSetInfo = {
  reps: number;
  weight: number;
  duration: number;
};

export type HistoryPoint = {
  dateLabel: string;
  value: number;
  sets: HistoryPointSetInfo[];
};

export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(String(value));
  if (Number.isNaN(num)) return null;
  return num;
};

export const buildChartData = (
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
      if (config.mode === "reps_only") {
        const repsOnlyWeightTarget = toNumber(config.weightTarget);
        const filterByWeight =
          repsOnlyWeightTarget !== null && repsOnlyWeightTarget > 0;

        for (const ex of exercises) {
          for (const set of ex.sets ?? []) {
            const weight = toNumber((set as IWorkoutSetItem).weight) ?? 0;
            const reps = toNumber((set as IWorkoutSetItem).reps);
            const duration = toNumber((set as IWorkoutSetItem).duration) ?? 0;
            if (reps === null || reps <= 0) continue;
            if (filterByWeight ? weight !== repsOnlyWeightTarget : weight !== 0)
              continue;

            matchingSets.push({ reps, weight, duration });

            valueForWorkout =
              valueForWorkout === null ? reps : Math.max(valueForWorkout, reps);
          }
        }
      } else {
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
