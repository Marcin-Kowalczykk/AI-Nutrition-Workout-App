import type { CreateWorkoutFormType } from "../../../types";
import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutTemplateExerciseItem,
  IWorkoutTemplateSetItem,
} from "@/app/api/workout-templates/types";

export type TemplateExercise = IWorkoutTemplateExerciseItem;

const toNonNegativeNumber = (v: string | number | undefined): number => {
  if (v === undefined || v === null || v === "") return 0;
  const num = typeof v === "number" ? v : Number(String(v).trim());
  if (Number.isNaN(num) || num < 0) return 0;
  return num;
};

export const prepareExercisesForTemplate = (
  exercises: CreateWorkoutFormType["exercises"]
): TemplateExercise[] =>
  (exercises ?? [])
    // zachowujemy tylko ćwiczenia z nazwą lub jakimikolwiek setami
    .filter(
      (exercise) =>
        (exercise.name ?? "").trim() !== "" ||
        (exercise.sets?.length ?? 0) > 0
    )
    .map((exercise) => {
      const sets: IWorkoutTemplateSetItem[] = (exercise.sets ?? []).map(
        (set, index) => ({
          id: set.id,
          set_number: set.set_number ?? index + 1,
          reps: toNonNegativeNumber(set.reps),
          weight: toNonNegativeNumber(set.weight),
          duration: toNonNegativeNumber(set.duration),
        })
      );

      return {
        id: exercise.id,
        name: normalizeForComparison(exercise.name ?? ""),
        sets,
      };
    });
