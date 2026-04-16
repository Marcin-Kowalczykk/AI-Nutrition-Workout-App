"use client";

//libs
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startOfDay } from "date-fns";

//hooks
import type { UseFormReturn } from "react-hook-form";
import { useCreateWorkout } from "../api/use-create-workout";
import { useUpdateWorkout } from "../api/use-update-workout";
import { useDeleteWorkout } from "../api/use-delete-workout";
import { useCreateTemplate } from "@/components/workout-template/api/use-create-template";
import { useUpdateTemplate } from "@/components/workout-template/api/use-update-template";
import { useDeleteTemplate } from "@/components/workout-template/api/use-delete-template";

//helpers
import {
  getComparisonBaselineString,
  prepareExercisesForSubmission,
  prepareExercisesForTemplate,
} from "../helpers";

//types
import type { CreateWorkoutFormType } from "../types";
import type { PreparedExercise } from "../helpers";

interface UseWorkoutFormSubmitProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  isTemplateMode: boolean;
  workoutId: string | null;
  setWorkoutId: (id: string | null) => void;
  templateId: string | null;
  setTemplateId: (id: string | null) => void;
  isFirstSave: boolean;
  setIsFirstSave: (value: boolean) => void;
  currentEntityId: string | null;
  defaultWorkoutDate: string;
  clearCache: () => void;
}

export const useWorkoutFormSubmit = ({
  form,
  isTemplateMode,
  workoutId,
  setWorkoutId,
  templateId,
  setTemplateId,
  isFirstSave,
  setIsFirstSave,
  currentEntityId,
  defaultWorkoutDate,
  clearCache,
}: UseWorkoutFormSubmitProps) => {
  const router = useRouter();
  const [lastSavedBaseline, setLastSavedBaseline] = useState<string | null>(null);
  const lastSavedExercisesRef = useRef<CreateWorkoutFormType["exercises"] | null>(null);

  const setBaselineFromValues = useCallback(
    (values: CreateWorkoutFormType) => {
      setLastSavedBaseline(getComparisonBaselineString(values, isTemplateMode));
      lastSavedExercisesRef.current = values.exercises;
    },
    [isTemplateMode]
  );

  const hasFormChanges = useCallback(() => {
    const values = form.getValues();
    const currentBaseline = getComparisonBaselineString(values, isTemplateMode);
    if (lastSavedBaseline === null) {
      const emptyBaseline = getComparisonBaselineString(
        { name: "", description: "", workout_date: defaultWorkoutDate, exercises: [] },
        isTemplateMode
      );
      return currentBaseline !== emptyBaseline;
    }
    return currentBaseline !== lastSavedBaseline;
  }, [form, isTemplateMode, lastSavedBaseline, defaultWorkoutDate]);

  const hasExerciseChanges = useCallback(
    (exerciseIndex: number) => {
      const currentExercises = form.getValues("exercises");
      const saved = lastSavedExercisesRef.current;
      const current = currentExercises[exerciseIndex];
      if (!current) return false;
      if (saved === null) {
        return !!(current.name ?? "").trim() ||
          (current.sets ?? []).some(
            (s) => (s.reps ?? "") !== "" || (s.weight ?? "") !== "" || (s.duration ?? "") !== ""
          );
      }
      const savedExercise = saved.find((e) => e.id === current.id);
      if (!savedExercise) return true;
      const norm = (val: unknown): number | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const n = Number(val);
        return Number.isNaN(n) ? undefined : n;
      };
      const normalizeEx = (ex: (typeof currentExercises)[number]) => ({
        id: ex.id, name: (ex.name ?? "").trim(), unitType: ex.unitType,
        sets: (ex.sets ?? []).map((set) => ({
          id: set.id, set_number: set.set_number ?? 0,
          reps: norm(set.reps), weight: norm(set.weight), duration: norm(set.duration),
          isChecked: !!set.isChecked, rpe: set.rpe ?? null,
        })),
      });
      return JSON.stringify(normalizeEx(current)) !== JSON.stringify(normalizeEx(savedExercise));
    },
    [form]
  );

  const getCreatedAtFromWorkoutDate = (workoutDateStr: string) =>
    startOfDay(new Date(workoutDateStr + "T12:00:00")).toISOString();

  const { mutate: createWorkout, isPending: isCreating, isError: isCreateError, error: createError } = useCreateWorkout({
    onSuccess: (data) => { setWorkoutId(data.id); setIsFirstSave(false); clearCache(); toast.success("Workout created successfully"); router.replace(`/workout/edit?id=${data.id}`); },
    onError: (error) => { toast.error(error || "Failed to create workout. Please try again."); },
  });

  const { mutate: updateWorkout, isPending: isUpdating, isError: isUpdateError, error: updateError } = useUpdateWorkout({
    onSuccess: () => { clearCache(); toast.success("Workout updated successfully"); },
    onError: (error) => { toast.error(error || "Failed to update workout. Please try again."); },
  });

  const { mutate: deleteWorkout, isPending: isDeleting } = useDeleteWorkout({
    onSuccess: () => {
      clearCache();
      form.reset({ name: "", description: "", workout_date: defaultWorkoutDate, exercises: [] });
      setWorkoutId(null); setIsFirstSave(true); setLastSavedBaseline(null);
      lastSavedExercisesRef.current = null;
      toast.success("Workout discarded");
    },
    onError: (error) => { toast.error(error || "Failed to delete workout. Please try again."); },
  });

  const { mutate: createTemplate } = useCreateTemplate({
    onSuccess: (data) => { setTemplateId(data.id); setIsFirstSave(false); clearCache(); toast.success("Template created successfully"); router.replace(`/workout/template/${data.id}/edit`); },
    onError: (error) => { toast.error(error || "Failed to create template. Please try again."); },
  });

  const { mutate: updateTemplate, isPending: isUpdatingTemplate } = useUpdateTemplate({
    onSuccess: () => { clearCache(); toast.success("Template updated successfully"); },
    onError: (error) => { toast.error(error || "Failed to update template. Please try again."); },
  });

  const { mutate: deleteTemplate, isPending: isDeletingTemplate } = useDeleteTemplate({
    onSuccess: () => {
      clearCache();
      form.reset({ name: "", description: "", exercises: [] });
      setTemplateId(null); setIsFirstSave(true); setLastSavedBaseline(null);
      lastSavedExercisesRef.current = null;
      toast.success("Template discarded");
    },
    onError: (error) => { toast.error(error || "Failed to delete template. Please try again."); },
  });

  const saveToServer = useCallback((
    values: CreateWorkoutFormType,
    prepared: PreparedExercise[],
    onSuccess: () => void
  ) => {
    if (!currentEntityId) return;
    const exercises = prepared.length > 0 ? prepared : undefined;
    if (isTemplateMode) {
      updateTemplate({ id: currentEntityId, name: values.name, description: values.description, exercises }, { onSuccess });
    } else {
      const created_at = values.workout_date ? getCreatedAtFromWorkoutDate(values.workout_date) : undefined;
      updateWorkout({ id: currentEntityId, name: values.name, description: values.description, end_date: new Date().toISOString(), ...(created_at && { created_at }), exercises }, { onSuccess });
    }
  }, [currentEntityId, isTemplateMode, updateTemplate, updateWorkout]);

  const onSubmitHandler = async (values: CreateWorkoutFormType) => {
    const { name, description, exercises, workout_date } = values;
    const currentDate = new Date().toISOString();
    const filteredExercises = prepareExercisesForSubmission(exercises);
    const created_at = workout_date && !isTemplateMode ? getCreatedAtFromWorkoutDate(workout_date) : undefined;
    const setBaselineOnSuccess = () => setBaselineFromValues(values);

    if (isTemplateMode) {
      const templateExercises = prepareExercisesForTemplate(exercises);
      if (isFirstSave && !currentEntityId) {
        createTemplate({ name, description: description || undefined, exercises: templateExercises.length > 0 ? templateExercises : undefined }, { onSuccess: setBaselineOnSuccess });
      } else if (currentEntityId) {
        updateTemplate({ id: currentEntityId, name, description: description || undefined, exercises: templateExercises.length > 0 ? templateExercises : undefined }, { onSuccess: setBaselineOnSuccess });
      }
    } else {
      if (isFirstSave && !workoutId) {
        createWorkout({ name, description: description || undefined, start_date: currentDate, ...(created_at && { created_at }), exercises: filteredExercises.length > 0 ? filteredExercises : undefined }, { onSuccess: setBaselineOnSuccess });
      } else if (workoutId) {
        updateWorkout({ id: workoutId, name, description: description || undefined, end_date: currentDate, ...(created_at && { created_at }), exercises: filteredExercises.length > 0 ? filteredExercises : undefined }, { onSuccess: setBaselineOnSuccess });
      } else if (!isFirstSave && !workoutId) {
        console.error("Workout ID is missing during update");
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const isPending = isCreating || isUpdating || isDeleting || isUpdatingTemplate || isDeletingTemplate;
  const isError = isCreateError || isUpdateError;
  const error = createError || updateError;
  const submitLabel = isFirstSave
    ? isTemplateMode ? "Save Template" : "Save Workout"
    : isTemplateMode ? "Update Template" : "Update Workout";

  return {
    lastSavedBaseline, setLastSavedBaseline,
    lastSavedExercisesRef,
    setBaselineFromValues,
    hasFormChanges,
    hasExerciseChanges,
    saveToServer,
    onSubmitHandler,
    deleteWorkout,
    deleteTemplate,
    isUpdating,
    isDeleting,
    isDeletingTemplate,
    isPending,
    isError,
    error,
    submitLabel,
  };
};
