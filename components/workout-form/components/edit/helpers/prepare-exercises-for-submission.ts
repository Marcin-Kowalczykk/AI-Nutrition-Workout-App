import { normalizeForComparison } from "@/lib/normalize-string";
import type { CreateWorkoutFormType } from "../../../types";

type FormExercise = CreateWorkoutFormType["exercises"][number];
type FormSet = FormExercise["sets"][number];

export type PreparedSet = {
  id: string;
  set_number: number;
  reps: number;
  weight: number;
  duration: number;
  isChecked: boolean;
};

export type PreparedExercise = {
  id: string;
  name: string;
  sets: PreparedSet[];
};

const toNum = (v: string | number | undefined): number =>
  v === undefined || v === null || v === ""
    ? 0
    : typeof v === "number"
      ? v
      : Number(v) || 0;

const toNumOptional = (v: string | number | undefined): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export const prepareExercisesForSubmission = (
  exercises: CreateWorkoutFormType["exercises"]
): PreparedExercise[] =>
  exercises
    .filter((exercise: FormExercise) => exercise.name || (exercise.sets?.length ?? 0) > 0)
    .map((exercise: FormExercise) => {
      const filteredSets = (exercise.sets ?? [])
        .filter(
          (set: FormSet) =>
            (set.reps ?? "") !== "" ||
            (set.weight ?? "") !== "" ||
            (set.duration ?? "") !== ""
        )
        .map((set: FormSet) => ({
          id: set.id,
          set_number: set.set_number ?? 0,
          reps: toNum(set.reps),
          weight: toNum(set.weight),
          duration: toNum(set.duration),
          isChecked: set.isChecked ?? false,
        }));

      return {
        id: exercise.id,
        name: normalizeForComparison(exercise.name ?? ""),
        sets: filteredSets,
      };
    })
    .filter((exercise: PreparedExercise) => exercise.name || exercise.sets.length > 0);
