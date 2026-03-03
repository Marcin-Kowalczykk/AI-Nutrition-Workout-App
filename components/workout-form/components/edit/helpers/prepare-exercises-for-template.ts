import type { CreateWorkoutFormType } from "../../../types";
import { prepareExercisesForSubmission } from "./prepare-exercises-for-submission";
import type { PreparedExercise } from "./prepare-exercises-for-submission";

export type TemplateExercise = Omit<PreparedExercise, "sets"> & {
  sets: Omit<PreparedExercise["sets"][number], "isChecked">[];
};

export const prepareExercisesForTemplate = (
  exercises: CreateWorkoutFormType["exercises"]
): TemplateExercise[] =>
  prepareExercisesForSubmission(exercises).map((exercise: PreparedExercise) => ({
    ...exercise,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- isChecked excluded for template format
    sets: exercise.sets.map(({ isChecked, ...set }) => set),
  }));
