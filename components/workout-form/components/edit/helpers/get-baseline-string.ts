import type { CreateWorkoutFormType } from "../../../types";
import { prepareExercisesForSubmission } from "./prepare-exercises-for-submission";
import { prepareExercisesForTemplate } from "./prepare-exercises-for-template";

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
