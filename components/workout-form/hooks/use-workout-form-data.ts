"use client";

//libs
import { useEffect, useRef } from "react";
import { format } from "date-fns";

//hooks
import type { UseFormReturn } from "react-hook-form";
import { useGetWorkout } from "../api/use-get-workout";
import { useGetTemplate } from "@/components/workout-template/api/use-get-template";

//libs
import { getFormCache } from "@/lib/form-cache";
import { normalizeForComparison } from "@/lib/normalize-string";

//helpers
import {
  formatNumericField,
  getComparisonBaselineString,
  inferUnitType,
  normalizeCachedFormData,
} from "../helpers";

//types
import type { CreateWorkoutFormType } from "../types";
import type {
  IWorkoutTemplateExerciseItem,
  IWorkoutTemplateSetItem,
} from "@/app/api/workout-templates/types";

interface UseWorkoutFormDataProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  isTemplateMode: boolean;
  initialWorkoutId?: string | null;
  initialTemplateId?: string | null;
  prefillFromTemplateId?: string | null;
  cacheKey: string;
  defaultWorkoutDate: string;
  setIsFirstSave: (value: boolean) => void;
  setLastSavedBaseline: (value: string | null) => void;
  lastSavedExercisesRef: React.MutableRefObject<CreateWorkoutFormType["exercises"] | null>;
}

export const useWorkoutFormData = ({
  form,
  isTemplateMode,
  initialWorkoutId,
  initialTemplateId,
  prefillFromTemplateId,
  cacheKey,
  defaultWorkoutDate,
  setIsFirstSave,
  setLastSavedBaseline,
  lastSavedExercisesRef,
}: UseWorkoutFormDataProps) => {
  const hasLoadedWorkoutDataRef = useRef(false);
  const hasLoadedTemplateDataRef = useRef(false);
  const lastPrefilledTemplateIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  const { data: workoutData, isLoading: isLoadingWorkout } = useGetWorkout({
    workoutId: initialWorkoutId || null,
    enabled: !isTemplateMode && !!initialWorkoutId,
  });

  const { data: templateData, isLoading: isLoadingTemplate } = useGetTemplate({
    templateId: initialTemplateId || null,
    enabled: isTemplateMode && !!initialTemplateId,
  });

  const { data: prefillTemplateData } = useGetTemplate({
    templateId: prefillFromTemplateId || null,
    enabled: !isTemplateMode && !initialWorkoutId && !!prefillFromTemplateId,
  });

  // Load from cache on new (empty) form — runs once on mount
  useEffect(() => {
    if (!isInitialMountRef.current) return;
    if (isTemplateMode ? initialTemplateId : initialWorkoutId) return;
    if (prefillFromTemplateId) return;

    const loadCached = async () => {
      try {
        const cached = await getFormCache(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const toReset =
            isTemplateMode ||
            (parsed as Record<string, unknown>).workout_date !== undefined
              ? parsed
              : { ...parsed, workout_date: defaultWorkoutDate };
          form.reset(normalizeCachedFormData(toReset, defaultWorkoutDate, isTemplateMode));
        }
      } catch (error) {
        console.error("Error loading cached form:", error);
      }
    };
    loadCached();
    isInitialMountRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from template (workout-create page)
  useEffect(() => {
    if (!prefillFromTemplateId) { lastPrefilledTemplateIdRef.current = null; return; }
    if (isTemplateMode || initialWorkoutId || !prefillTemplateData) return;
    if (lastPrefilledTemplateIdRef.current === prefillFromTemplateId) return;

    lastPrefilledTemplateIdRef.current = prefillFromTemplateId;
    const formData: CreateWorkoutFormType = {
      name: prefillTemplateData.name || "",
      description: prefillTemplateData.description || "",
      workout_date: defaultWorkoutDate,
      exercises: (prefillTemplateData.exercises || []).map((exercise: IWorkoutTemplateExerciseItem) => {
        const sets = (exercise.sets || []).map((set: IWorkoutTemplateSetItem) => ({
          id: set.id, set_number: set.set_number || 0,
          reps: formatNumericField(set.reps), weight: formatNumericField(set.weight), duration: formatNumericField(set.duration),
          isChecked: false,
        }));
        return { id: exercise.id, name: normalizeForComparison(exercise.name ?? ""), unitType: inferUnitType(sets), sets };
      }),
    };
    form.reset(formData);
    setLastSavedBaseline(getComparisonBaselineString(formData, false));
    lastSavedExercisesRef.current = formData.exercises;
  }, [prefillFromTemplateId, prefillTemplateData, isTemplateMode, initialWorkoutId, form, defaultWorkoutDate, setLastSavedBaseline, lastSavedExercisesRef]);

  // Load existing workout data
  useEffect(() => {
    if (!initialWorkoutId || !workoutData) {
      if (!initialWorkoutId) hasLoadedWorkoutDataRef.current = false;
      return;
    }
    if (hasLoadedWorkoutDataRef.current) return;
    hasLoadedWorkoutDataRef.current = true;
    setIsFirstSave(false);

    const formData: CreateWorkoutFormType = {
      name: workoutData.name || "",
      description: workoutData.description || "",
      workout_date: workoutData.created_at ? format(new Date(workoutData.created_at), "yyyy-MM-dd") : defaultWorkoutDate,
      exercises: (workoutData.exercises || []).map((exercise) => {
        const sets = (exercise.sets || []).map((set) => ({
          id: set.id, set_number: set.set_number || 0,
          reps: formatNumericField(set.reps), weight: formatNumericField(set.weight), duration: formatNumericField(set.duration),
          isChecked: set.isChecked || false, rpe: set.rpe ?? null,
        }));
        return { id: exercise.id, name: normalizeForComparison(exercise.name ?? ""), unitType: inferUnitType(sets), sets };
      }),
    };
    form.reset(formData);
    setLastSavedBaseline(getComparisonBaselineString(formData, false));
    lastSavedExercisesRef.current = formData.exercises;
    (async () => {
      try {
        const cached = await getFormCache(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const toReset = (parsed as Record<string, unknown>).workout_date !== undefined
            ? parsed
            : { ...parsed, workout_date: formData.workout_date ?? defaultWorkoutDate };
          form.reset(normalizeCachedFormData(toReset, defaultWorkoutDate, false));
        }
      } catch (error) { console.error("Error loading cached workout form:", error); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutData, initialWorkoutId, cacheKey]);

  // Load existing template data
  useEffect(() => {
    if (!initialTemplateId || !templateData) {
      if (!initialTemplateId) hasLoadedTemplateDataRef.current = false;
      return;
    }
    if (hasLoadedTemplateDataRef.current) return;
    hasLoadedTemplateDataRef.current = true;
    setIsFirstSave(false);

    const formData: CreateWorkoutFormType = {
      name: templateData.name || "",
      description: templateData.description || "",
      exercises: (templateData.exercises || []).map((exercise: IWorkoutTemplateExerciseItem) => {
        const sets = (exercise.sets || []).map((set: IWorkoutTemplateSetItem) => ({
          id: set.id, set_number: set.set_number || 0,
          reps: formatNumericField(set.reps), weight: formatNumericField(set.weight), duration: formatNumericField(set.duration),
          isChecked: false,
        }));
        return { id: exercise.id, name: normalizeForComparison(exercise.name ?? ""), unitType: inferUnitType(sets), sets };
      }),
    };
    form.reset(formData);
    setLastSavedBaseline(getComparisonBaselineString(formData, true));
    lastSavedExercisesRef.current = formData.exercises;
    (async () => {
      try {
        const cached = await getFormCache(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          form.reset(normalizeCachedFormData(parsed, defaultWorkoutDate, true));
        }
      } catch (error) { console.error("Error loading cached template form:", error); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData, initialTemplateId, cacheKey]);

  return { isLoadingWorkout, isLoadingTemplate };
};
