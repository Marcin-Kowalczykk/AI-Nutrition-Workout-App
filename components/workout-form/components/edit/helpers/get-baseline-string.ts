import type { CreateWorkoutFormType } from "../../../types";
import { prepareExercisesForSubmission } from "./prepare-exercises-for-submission";
import { prepareExercisesForTemplate } from "./prepare-exercises-for-template";

const normalizeNum = (val: unknown): number | undefined => {
  if (val === null || val === undefined || val === "") return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
};

/** Serializes full form state (including empty sets) for change detection. */
export const getComparisonBaselineString = (
  values: CreateWorkoutFormType,
  isTemplateMode: boolean
): string => {
  const exercises = (values.exercises ?? []).map((ex) => ({
    id: ex.id,
    name: (ex.name ?? "").trim(),
    unitType: ex.unitType,
    sets: (ex.sets ?? []).map((set) => ({
      id: set.id,
      set_number: set.set_number ?? 0,
      reps: normalizeNum(set.reps),
      weight: normalizeNum(set.weight),
      duration: normalizeNum(set.duration),
      isChecked: !!set.isChecked,
    })),
  }));
  const base: Record<string, unknown> = {
    name: values.name ?? "",
    description: values.description ?? "",
    exercises,
  };
  if (!isTemplateMode) {
    base.workout_date = values.workout_date ?? "";
  }
  return JSON.stringify(base);
};

export const getBaselineString = (
  values: CreateWorkoutFormType,
  isTemplateMode: boolean
): string => {
  const exercises = isTemplateMode
    ? prepareExercisesForTemplate(values.exercises)
    : prepareExercisesForSubmission(values.exercises);
  const base: Record<string, unknown> = {
    name: values.name,
    description: values.description ?? "",
    exercises,
  };
  if (!isTemplateMode && values.workout_date !== undefined) {
    base.workout_date = values.workout_date;
  }
  return JSON.stringify(base);
};
