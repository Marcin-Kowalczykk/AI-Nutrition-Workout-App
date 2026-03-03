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
  return JSON.stringify({
    name: values.name,
    description: values.description ?? "",
    exercises,
  });
};
