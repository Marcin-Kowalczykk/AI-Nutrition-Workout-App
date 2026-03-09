import type { CreateWorkoutFormType } from "../../../types";

const formatNumericField = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const num =
    typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isNaN(num) || num === 0) return "";
  return String(num);
};

export const normalizeCachedFormData = (
  parsed: unknown,
  defaultWorkoutDate: string,
  isTemplateMode: boolean
): CreateWorkoutFormType => {
  if (!parsed || typeof parsed !== "object") {
    return {
      name: "",
      description: "",
      workout_date: defaultWorkoutDate,
      exercises: [],
    };
  }
  const d = parsed as Record<string, unknown>;
  const exercises = Array.isArray(d.exercises)
    ? (d.exercises as Record<string, unknown>[]).map((e) => {
        const sets = Array.isArray(e.sets)
          ? (e.sets as Record<string, unknown>[]).map((s) => ({
              ...s,
              reps: formatNumericField(s.reps),
              weight: formatNumericField(s.weight),
              duration: formatNumericField(s.duration),
            }))
          : [];
        return { ...e, sets };
      })
    : [];
  return {
    name: typeof d.name === "string" ? d.name : "",
    description: typeof d.description === "string" ? d.description : "",
    ...(isTemplateMode
      ? {}
      : {
          workout_date:
            d.workout_date != null
              ? String(d.workout_date)
              : defaultWorkoutDate,
        }),
    exercises,
  } as CreateWorkoutFormType;
};
