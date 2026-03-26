"use client";

// dependencies
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, subDays } from "date-fns";

// hooks
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCreateWorkout } from "../../api/use-create-workout";
import { useUpdateWorkout } from "../../api/use-update-workout";
import { useGetWorkout } from "../../api/use-get-workout";
import { useDeleteWorkout } from "../../api/use-delete-workout";
import { useCreateTemplate } from "@/components/workout-template/api/use-create-template";
import { useUpdateTemplate } from "@/components/workout-template/api/use-update-template";
import { useGetTemplate } from "@/components/workout-template/api/use-get-template";
import { useDeleteTemplate } from "@/components/workout-template/api/use-delete-template";

// components
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox"; // replaced with native input for iOS keyboard fix
import { Loader } from "@/components/shared/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenterWrapper from "@/components/shared/center-wrapper";
import { ConfirmModal } from "../../../shared/confirm-modal";
import { ExercisesSelect } from "@/components/shared/exercises-select";
import { DatePicker } from "@/components/shared/date-picker";
import { RpeToggleButton, RpeSliderPanel, useRpeState } from "./rpe";

// types and schemas
import { getFormCache, removeFormCache, setFormCache } from "@/lib/form-cache";
import {
  CreateWorkoutFormType,
  createWorkoutFormSchema,
  templateWorkoutFormSchema,
  WORKOUT_UNIT_TYPE,
  type WorkoutUnitType,
} from "../../types";
import { ExerciseUnitType } from "@/app/api/exercises/types";
import { normalizeForComparison } from "@/lib/normalize-string";
import { useWorkoutUnsavedChanges } from "../../context/workout-unsaved-context";
import {
  ExerciseHistoryStrip,
  ExerciseHistoryStripContent,
} from "./exercise-history-strip/exercise-history-strip";
import type {
  IWorkoutTemplateExerciseItem,
  IWorkoutTemplateSetItem,
} from "@/app/api/workout-templates/types";
import {
  formatNumericField,
  getComparisonBaselineString,
  inferUnitType,
  normalizeCachedFormData,
  prepareExercisesForSubmission,
  prepareExercisesForTemplate,
  type PreparedExercise,
} from "./helpers";

const WORKOUT_FORM_CACHE_KEY = "workout-form-draft";
const TEMPLATE_FORM_CACHE_KEY = "workout-template-form-draft";

interface WorkoutFormProps {
  workoutId?: string | null;
  isTemplateMode?: boolean;
  templateId?: string | null;
  prefillFromTemplateId?: string | null;
}

export const WorkoutForm = ({
  workoutId: initialWorkoutId,
  isTemplateMode = false,
  templateId: initialTemplateId,
  prefillFromTemplateId,
}: WorkoutFormProps) => {
  const router = useRouter();
  const entityId = isTemplateMode ? initialTemplateId : initialWorkoutId;
  const [workoutId, setWorkoutId] = useState<string | null>(
    initialWorkoutId || null
  );
  const [templateId, setTemplateId] = useState<string | null>(
    initialTemplateId || null
  );
  const currentEntityId = isTemplateMode ? templateId : workoutId;
  const [isFirstSave, setIsFirstSave] = useState(!entityId);
  const [isDiscardWorkoutModalOpen, setIsDiscardWorkoutModalOpen] =
    useState(false);
  const [removeExerciseModal, setRemoveExerciseModal] = useState<{
    open: boolean;
    exerciseIndex: number | null;
  }>({ open: false, exerciseIndex: null });
  const [removeSetModal, setRemoveSetModal] = useState<{
    open: boolean;
    exerciseIndex: number | null;
    setIndex: number | null;
  }>({ open: false, exerciseIndex: null, setIndex: null });
  const [historyOpenByExerciseId, setHistoryOpenByExerciseId] = useState<
    Record<string, boolean>
  >({});
  const {
    rpeOpenBySet,
    rpeSliderDisplayBySet,
    toggleRpePanel,
    clearRpeDisplay,
    setRpeDisplay,
  } = useRpeState();
  const [headerVisible, setHeaderVisible] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const hasLoadedWorkoutDataRef = useRef(false);
  const hasLoadedTemplateDataRef = useRef(false);
  const lastPrefilledTemplateIdRef = useRef<string | null>(null);
  const [lastSavedBaseline, setLastSavedBaseline] = useState<string | null>(
    null
  );
  const lastSavedExercisesRef = useRef<
    CreateWorkoutFormType["exercises"] | null
  >(null);
  const { setHasUnsavedChanges, discardRef } = useWorkoutUnsavedChanges();

  const baseCacheKey = isTemplateMode
    ? TEMPLATE_FORM_CACHE_KEY
    : WORKOUT_FORM_CACHE_KEY;
  const entityCacheId = isTemplateMode ? initialTemplateId : initialWorkoutId;
  const cacheKey = entityCacheId
    ? `${baseCacheKey}:${entityCacheId}`
    : baseCacheKey;

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

  const saveToCache = useCallback(
    (data: CreateWorkoutFormType) => {
      setFormCache(cacheKey, JSON.stringify(data));
    },
    [cacheKey]
  );

  const clearCache = useCallback(() => {
    removeFormCache(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    discardRef.current = clearCache;
    return () => {
      discardRef.current = null;
    };
  }, [discardRef, clearCache]);

  const {
    mutate: createWorkout,
    isPending: isCreating,
    isError: isCreateError,
    error: createError,
  } = useCreateWorkout({
    onSuccess: (data) => {
      setWorkoutId(data.id);
      setIsFirstSave(false);
      clearCache();
      toast.success("Workout created successfully");

      router.replace(`/workout/edit?id=${data.id}`);
    },
    onError: (error) => {
      toast.error(error || "Failed to create workout. Please try again.");
    },
  });

  const {
    mutate: updateWorkout,
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError,
  } = useUpdateWorkout({
    onSuccess: () => {
      clearCache();
      toast.success("Workout updated successfully");
    },
    onError: (error) => {
      toast.error(error || "Failed to update workout. Please try again.");
    },
  });

  const { mutate: deleteWorkout, isPending: isDeleting } = useDeleteWorkout({
    onSuccess: () => {
      clearCache();
      form.reset({
        name: "",
        description: "",
        workout_date: defaultWorkoutDate,
        exercises: [],
      });
      setWorkoutId(null);
      setIsFirstSave(true);
      setLastSavedBaseline(null);
      lastSavedExercisesRef.current = null;
      setIsDiscardWorkoutModalOpen(false);
      toast.success("Workout discarded");
    },
    onError: (error) => {
      toast.error(error || "Failed to delete workout. Please try again.");
    },
  });

  const { mutate: createTemplate } = useCreateTemplate({
    onSuccess: (data) => {
      setTemplateId(data.id);
      setIsFirstSave(false);
      clearCache();
      toast.success("Template created successfully");
      router.replace(`/workout/template/${data.id}/edit`);
    },
    onError: (error) => {
      toast.error(error || "Failed to create template. Please try again.");
    },
  });

  const { mutate: updateTemplate, isPending: isUpdatingTemplate } =
    useUpdateTemplate({
      onSuccess: () => {
        clearCache();
        toast.success("Template updated successfully");
      },
      onError: (error) => {
        toast.error(error || "Failed to update template. Please try again.");
      },
    });

  const { mutate: deleteTemplate, isPending: isDeletingTemplate } =
    useDeleteTemplate({
      onSuccess: () => {
        clearCache();
        form.reset({ name: "", description: "", exercises: [] });
        setTemplateId(null);
        setIsFirstSave(true);
        setLastSavedBaseline(null);
        lastSavedExercisesRef.current = null;
        setIsDiscardWorkoutModalOpen(false);
        toast.success("Template discarded");
      },
      onError: (error) => {
        toast.error(error || "Failed to delete template. Please try again.");
      },
    });

  const defaultWorkoutDate = format(new Date(), "yyyy-MM-dd");

  const form = useForm<CreateWorkoutFormType>({
    resolver: zodResolver(
      isTemplateMode ? templateWorkoutFormSchema : createWorkoutFormSchema
    ) as Resolver<CreateWorkoutFormType>,
    mode: "onTouched",
    defaultValues: {
      name: "",
      description: "",
      workout_date: defaultWorkoutDate,
      exercises: [],
    },
  });

  useEffect(() => {
    if (!isInitialMountRef.current) return;
    if (entityId) return;
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
          form.reset(
            normalizeCachedFormData(toReset, defaultWorkoutDate, isTemplateMode)
          );
        }
      } catch (error) {
        console.error("Error loading cached form:", error);
      }
    };
    loadCached();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!prefillFromTemplateId) {
      lastPrefilledTemplateIdRef.current = null;
      return;
    }
    if (isTemplateMode || initialWorkoutId || !prefillTemplateData) return;
    if (lastPrefilledTemplateIdRef.current === prefillFromTemplateId) return;

    lastPrefilledTemplateIdRef.current = prefillFromTemplateId;
    const formData: CreateWorkoutFormType = {
      name: prefillTemplateData.name || "",
      description: prefillTemplateData.description || "",
      workout_date: defaultWorkoutDate,
      exercises: (prefillTemplateData.exercises || []).map(
        (exercise: IWorkoutTemplateExerciseItem) => {
          const sets = (exercise.sets || []).map(
            (set: IWorkoutTemplateSetItem) => ({
              id: set.id,
              set_number: set.set_number || 0,
              reps: formatNumericField(set.reps),
              weight: formatNumericField(set.weight),
              duration: formatNumericField(set.duration),
              isChecked: false,
            })
          );
          return {
            id: exercise.id,
            name: normalizeForComparison(exercise.name ?? ""),
            unitType: inferUnitType(sets),
            sets,
          };
        }
      ),
    };
    form.reset(formData);
    setLastSavedBaseline(getComparisonBaselineString(formData, false));
    lastSavedExercisesRef.current = formData.exercises;
  }, [
    prefillFromTemplateId,
    prefillTemplateData,
    isTemplateMode,
    initialWorkoutId,
    form,
    defaultWorkoutDate,
  ]);

  useEffect(() => {
    if (!initialWorkoutId || !workoutData) {
      if (!initialWorkoutId) {
        hasLoadedWorkoutDataRef.current = false;
      }
      return;
    }

    if (hasLoadedWorkoutDataRef.current) return;

    hasLoadedWorkoutDataRef.current = true;
    setWorkoutId(workoutData.id);
    setIsFirstSave(false);

    const formData: CreateWorkoutFormType = {
      name: workoutData.name || "",
      description: workoutData.description || "",
      workout_date: workoutData.created_at
        ? format(new Date(workoutData.created_at), "yyyy-MM-dd")
        : defaultWorkoutDate,
      exercises: (workoutData.exercises || []).map((exercise) => {
        const sets = (exercise.sets || []).map((set) => ({
          id: set.id,
          set_number: set.set_number || 0,
          reps: formatNumericField(set.reps),
          weight: formatNumericField(set.weight),
          duration: formatNumericField(set.duration),
          isChecked: set.isChecked || false,
          rpe: set.rpe ?? null,
        }));
        return {
          id: exercise.id,
          name: normalizeForComparison(exercise.name ?? ""),
          unitType: inferUnitType(sets),
          sets,
        };
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
          const toReset =
            (parsed as Record<string, unknown>).workout_date !== undefined
              ? parsed
              : {
                  ...parsed,
                  workout_date: formData.workout_date ?? defaultWorkoutDate,
                };
          form.reset(
            normalizeCachedFormData(toReset, defaultWorkoutDate, false)
          );
        }
      } catch (error) {
        console.error("Error loading cached workout form:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutData, initialWorkoutId, cacheKey]);

  useEffect(() => {
    if (!initialTemplateId || !templateData) {
      if (!initialTemplateId) {
        hasLoadedTemplateDataRef.current = false;
      }
      return;
    }

    if (hasLoadedTemplateDataRef.current) return;

    hasLoadedTemplateDataRef.current = true;
    setTemplateId(templateData.id);
    setIsFirstSave(false);

    const formData: CreateWorkoutFormType = {
      name: templateData.name || "",
      description: templateData.description || "",
      exercises: (templateData.exercises || []).map(
        (exercise: IWorkoutTemplateExerciseItem) => {
          const sets = (exercise.sets || []).map(
            (set: IWorkoutTemplateSetItem) => ({
              id: set.id,
              set_number: set.set_number || 0,
              reps: formatNumericField(set.reps),
              weight: formatNumericField(set.weight),
              duration: formatNumericField(set.duration),
              isChecked: false,
            })
          );
          return {
            id: exercise.id,
            name: normalizeForComparison(exercise.name ?? ""),
            unitType: inferUnitType(sets),
            sets,
          };
        }
      ),
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
      } catch (error) {
        console.error("Error loading cached template form:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData, initialTemplateId, cacheKey]);

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const hasFormChanges = useCallback(() => {
    const values = form.getValues();
    const currentBaseline = getComparisonBaselineString(values, isTemplateMode);

    if (lastSavedBaseline === null) {
      const emptyBaseline = getComparisonBaselineString(
        {
          name: "",
          description: "",
          workout_date: defaultWorkoutDate,
          exercises: [],
        },
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
        const hasName = !!(current.name ?? "").trim();
        const hasSets = (current.sets ?? []).some(
          (s) =>
            (s.reps ?? "") !== "" ||
            (s.weight ?? "") !== "" ||
            (s.duration ?? "") !== ""
        );
        return hasName || hasSets;
      }

      const savedExercise = saved.find((e) => e.id === current.id);
      if (!savedExercise) return true;

      const normalizeNumber = (val: unknown): number | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = Number(val);
        return Number.isNaN(num) ? undefined : num;
      };

      const normalizeExercise = (
        exercise: (typeof currentExercises)[number]
      ) => ({
        id: exercise.id,
        name: (exercise.name ?? "").trim(),
        unitType: exercise.unitType,
        sets: (exercise.sets ?? []).map((set) => ({
          id: set.id,
          set_number: set.set_number ?? 0,
          reps: normalizeNumber(set.reps),
          weight: normalizeNumber(set.weight),
          duration: normalizeNumber(set.duration),
          isChecked: !!set.isChecked,
          rpe: set.rpe ?? null,
        })),
      });

      const normalizedCurrent = normalizeExercise(current);
      const normalizedSaved = normalizeExercise(savedExercise);

      return (
        JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedSaved)
      );
    },
    [form]
  );

  const formValues = form.watch();

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentValues = form.getValues();
      saveToCache(currentValues);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formValues, form, saveToCache]);

  useEffect(() => {
    const hasChanges = hasFormChanges();
    setHasUnsavedChanges(hasChanges);

    return () => {
      setHasUnsavedChanges(false);
    };
  }, [formValues, hasFormChanges, setHasUnsavedChanges]);

  const setBaselineFromValues = useCallback(
    (values: CreateWorkoutFormType) => {
      setLastSavedBaseline(getComparisonBaselineString(values, isTemplateMode));
      lastSavedExercisesRef.current = values.exercises;
    },
    [isTemplateMode]
  );

  const isPending =
    isCreating ||
    isUpdating ||
    isDeleting ||
    isUpdatingTemplate ||
    isDeletingTemplate ||
    isLoadingWorkout ||
    isLoadingTemplate;
  const isError = isCreateError || isUpdateError;
  const error = createError || updateError;

  const getCreatedAtFromWorkoutDate = (workoutDateStr: string) =>
    startOfDay(new Date(workoutDateStr + "T12:00:00")).toISOString();

  const onSubmitHandler = async (values: CreateWorkoutFormType) => {
    const { name, description, exercises, workout_date } = values;
    const currentDate = new Date().toISOString();
    const filteredExercises = prepareExercisesForSubmission(exercises);
    const created_at =
      workout_date && !isTemplateMode
        ? getCreatedAtFromWorkoutDate(workout_date)
        : undefined;

    const setBaselineOnSuccess = () => setBaselineFromValues(values);

    if (isTemplateMode) {
      const templateExercises = prepareExercisesForTemplate(exercises);
      if (isFirstSave && !currentEntityId) {
        createTemplate(
          {
            name,
            description: description || undefined,
            exercises:
              templateExercises.length > 0 ? templateExercises : undefined,
          },
          { onSuccess: setBaselineOnSuccess }
        );
      } else if (currentEntityId) {
        updateTemplate(
          {
            id: currentEntityId,
            name,
            description: description || undefined,
            exercises:
              templateExercises.length > 0 ? templateExercises : undefined,
          },
          { onSuccess: setBaselineOnSuccess }
        );
      }
    } else {
      if (isFirstSave && !workoutId) {
        createWorkout(
          {
            name,
            description: description || undefined,
            start_date: currentDate,
            ...(created_at && { created_at }),
            exercises:
              filteredExercises.length > 0 ? filteredExercises : undefined,
          },
          { onSuccess: setBaselineOnSuccess }
        );
      } else if (workoutId) {
        updateWorkout(
          {
            id: workoutId,
            name,
            description: description || undefined,
            end_date: currentDate,
            ...(created_at && { created_at }),
            exercises:
              filteredExercises.length > 0 ? filteredExercises : undefined,
          },
          { onSuccess: setBaselineOnSuccess }
        );
      } else if (!isFirstSave && !workoutId) {
        console.error("Workout ID is missing during update");
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const applyUnitChange = useCallback(
    (exerciseIndex: number, newUnit: WorkoutUnitType) => {
      const values = form.getValues();
      const exercises = values.exercises ?? [];
      const updatedExercises = exercises.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        const sets = (exercise.sets ?? []).map((set) => ({
          ...set,
          weight: "",
          duration: "",
        }));
        return { ...exercise, unitType: newUnit, sets };
      });
      form.reset(
        { ...values, exercises: updatedExercises },
        { keepDefaultValues: false }
      );
    },
    [form]
  );

  const mapExerciseUnitToWorkoutUnit = (
    unitType: ExerciseUnitType | undefined
  ): WorkoutUnitType => {
    if (unitType === "time-based") return WORKOUT_UNIT_TYPE.DURATION;
    return WORKOUT_UNIT_TYPE.REPS_BASED;
  };

  if (
    (isLoadingWorkout && initialWorkoutId && !isTemplateMode) ||
    (isLoadingTemplate && initialTemplateId && isTemplateMode)
  ) {
    return (
      <CenterWrapper className="flex w-full min-h-[50vh] items-center justify-center">
        <Loader />
      </CenterWrapper>
    );
  }

  const handleAddExercise = () => {
    appendExercise({
      id: crypto.randomUUID(),
      name: "",
      unitType: WORKOUT_UNIT_TYPE.REPS_BASED,
      sets: [],
    });
  };

  const handleRemoveExerciseClick = (exerciseIndex: number) => {
    if (currentEntityId) {
      setRemoveExerciseModal({ open: true, exerciseIndex });
    } else {
      removeExercise(exerciseIndex);
      setBaselineFromValues(form.getValues());
    }
  };

  const saveToServer = (
    values: CreateWorkoutFormType,
    prepared: PreparedExercise[],
    onSuccess: () => void
  ) => {
    if (!currentEntityId) return;
    const exercises = prepared.length > 0 ? prepared : undefined;
    if (isTemplateMode) {
      updateTemplate(
        { id: currentEntityId, name: values.name, description: values.description, exercises },
        { onSuccess }
      );
    } else {
      const created_at =
        values.workout_date && getCreatedAtFromWorkoutDate(values.workout_date);
      updateWorkout(
        {
          id: currentEntityId,
          name: values.name,
          description: values.description,
          end_date: new Date().toISOString(),
          ...(created_at && { created_at }),
          exercises,
        },
        { onSuccess }
      );
    }
  };

  const handleConfirmRemoveExercise = () => {
    const exerciseIndex = removeExerciseModal.exerciseIndex;
    if (exerciseIndex === null || !currentEntityId) return;

    const values = form.getValues();
    const newExercises = values.exercises.filter((_, i) => i !== exerciseIndex);
    const prepared = prepareExercisesForSubmission(newExercises);
    const newValues: CreateWorkoutFormType = {
      name: values.name,
      description: values.description,
      exercises: newExercises,
      ...(isTemplateMode ? {} : { workout_date: values.workout_date ?? "" }),
    };

    saveToServer(values, prepared, () => {
      removeExercise(exerciseIndex);
      setRemoveExerciseModal({ open: false, exerciseIndex: null });
      setBaselineFromValues(newValues);
    });
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = form.getValues(`exercises.${exerciseIndex}`);
    if (!exercise?.name?.trim()) {
      return;
    }

    const currentSets = exercise?.sets ?? [];
    const nextSetNumber = currentSets.length + 1;

    form.setValue(`exercises.${exerciseIndex}.sets`, [
      ...currentSets,
      {
        id: crypto.randomUUID(),
        set_number: nextSetNumber,
        reps: "",
        weight: "",
        duration: "",
        isChecked: false,
      },
    ]);
  };

  const doRemoveSetFromForm = (exerciseIndex: number, setIndex: number) => {
    const exercise = form.getValues(`exercises.${exerciseIndex}`);
    const currentSets = exercise?.sets ?? [];
    const updatedSets = currentSets.filter((_, index) => index !== setIndex);
    const renumberedSets = updatedSets.map((set, index) => ({
      ...set,
      set_number: index + 1,
    }));
    form.setValue(`exercises.${exerciseIndex}.sets`, renumberedSets);
  };

  const handleRemoveSetClick = (exerciseIndex: number, setIndex: number) => {
    if (currentEntityId) {
      setRemoveSetModal({ open: true, exerciseIndex, setIndex });
    } else {
      doRemoveSetFromForm(exerciseIndex, setIndex);
      setBaselineFromValues(form.getValues());
    }
  };

  const handleConfirmRemoveSet = () => {
    const { exerciseIndex, setIndex } = removeSetModal;
    if (exerciseIndex === null || setIndex === null || !currentEntityId) return;

    const values = form.getValues();
    const exercise = values.exercises[exerciseIndex];
    if (!exercise) return;

    const newSets = exercise.sets
      .filter((_, i) => i !== setIndex)
      .map((set, i) => ({ ...set, set_number: i + 1 }));
    const newExercises = values.exercises.map((ex, i) =>
      i === exerciseIndex ? { ...ex, sets: newSets } : ex
    );
    const prepared = prepareExercisesForSubmission(newExercises);
    const newValues: CreateWorkoutFormType = {
      name: values.name,
      description: values.description,
      exercises: newExercises,
      ...(isTemplateMode ? {} : { workout_date: values.workout_date ?? "" }),
    };

    saveToServer(values, prepared, () => {
      doRemoveSetFromForm(exerciseIndex, setIndex);
      setRemoveSetModal({ open: false, exerciseIndex: null, setIndex: null });
      setBaselineFromValues(newValues);
    });
  };

  const handleDiscardWorkoutClick = () => {
    setIsDiscardWorkoutModalOpen(true);
  };

  const handleConfirmDiscard = () => {
    if (isTemplateMode && currentEntityId) {
      deleteTemplate(currentEntityId);
    } else if (!isTemplateMode && workoutId) {
      deleteWorkout(workoutId);
    } else {
      clearCache();
      form.reset({
        name: "",
        description: "",
        workout_date: defaultWorkoutDate,
        exercises: [],
      });
      setWorkoutId(null);
      setTemplateId(null);
      setIsFirstSave(true);
      setLastSavedBaseline(null);
      lastSavedExercisesRef.current = null;
      setIsDiscardWorkoutModalOpen(false);
      toast.success(
        isTemplateMode ? "Template discarded" : "Workout discarded"
      );
    }
  };

  const workoutName = form.watch("name") ?? "";
  const submitLabel = isFirstSave
    ? isTemplateMode ? "Save Template" : "Save Workout"
    : isTemplateMode ? "Update Template" : "Update Workout";

  const submitForm = (form.handleSubmit as unknown as (
    fn: (data: CreateWorkoutFormType) => void | Promise<void>
  ) => (e?: React.BaseSyntheticEvent) => void)(onSubmitHandler);

  return (
    <Form {...form}>
      <form
        onSubmit={submitForm}
        noValidate
      >
        <div className="flex flex-col gap-3">
          {!headerVisible && workoutName.toString().trim() && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="showHide"
                size="showHide"
                onClick={() => setHeaderVisible(true)}
              >
                <span className="flex items-center gap-1">
                  <span>Header</span>
                  <ChevronDown className="h-3 w-3" />
                </span>
              </Button>
            </div>
          )}

          {headerVisible && (
            <>
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>
                        {isTemplateMode ? "Template name" : "Workout Name"}*
                      </span>
                      {workoutName.toString().trim() && (
                        <Button
                          type="button"
                          variant="showHide"
                          size="showHide"
                          onClick={() => setHeaderVisible(false)}
                        >
                          <span className="flex items-center gap-1">
                            <span>Header</span>
                            <ChevronUp className="h-3 w-3" />
                          </span>
                        </Button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        autoComplete="off"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        autoComplete="off"
                        disabled={isPending}
                        rows={1}
                        className="resize-y"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description for your workout
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isTemplateMode && (
                <FormField
                  name="workout_date"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workout date</FormLabel>
                      <FormControl>
                        <DatePicker
                          label=""
                          value={
                            field.value
                              ? new Date(field.value + "T12:00:00")
                              : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? format(date, "yyyy-MM-dd") : undefined
                            )
                          }
                          placeholder="choose date"
                          showClear={false}
                          fromYear={new Date().getFullYear() - 1}
                          toYear={new Date().getFullYear()}
                          disabled={(date) => {
                            const d = startOfDay(date);
                            const today = startOfDay(new Date());
                            const oneYearAgo = subDays(today, 365);
                            return d < oneYearAgo || d > today;
                          }}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          <div className="flex flex-col gap-2">
            {exerciseFields.map((exercise, exerciseIndex) => (
              <Card key={exercise.id}>
                <CardHeader className="flex flex-row items-start space-y-0 p-2">
                  <CardTitle className="flex w-full flex-wrap items-stretch gap-x-1 gap-y-2 min-w-0">
                    <div className="flex shrink-0 items-center">
                      <ExerciseHistoryStrip
                        layout="split"
                        exerciseName={
                          (form.watch(`exercises.${exerciseIndex}.name`) ??
                            "") ||
                          undefined
                        }
                        isOpen={historyOpenByExerciseId[exercise.id] === true}
                        onOpenChange={(open) =>
                          setHistoryOpenByExerciseId((prev) => ({
                            ...prev,
                            [exercise.id]: open,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-1 min-w-0 items-center">
                      <FormField
                        control={form.control}
                        name={`exercises.${exerciseIndex}.name`}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl className="w-full">
                              <ExercisesSelect
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isPending}
                                onExerciseSelectedMeta={(meta) => {
                                  const newUnit = mapExerciseUnitToWorkoutUnit(
                                    meta.unitType
                                  );
                                  applyUnitChange(exerciseIndex, newUnit);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExerciseClick(exerciseIndex)}
                        disabled={isPending}
                        className="shrink-0 size-4 min-w-0 p-0.5 text-destructive hover:text-destructive"
                        aria-label="Remove exercise"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-w-0 flex-col gap-0.5 px-2 py-0">
                  <ExerciseHistoryStripContent
                    exerciseName={
                      (form.watch(`exercises.${exerciseIndex}.name`) ?? "") ||
                      undefined
                    }
                    isOpen={historyOpenByExerciseId[exercise.id] === true}
                  />
                  <div className="flex flex-col gap-1.5">
                    {(form.watch(`exercises.${exerciseIndex}.sets`) ?? []).map(
                      (set, setIndex) => {
                        const setErrors =
                          form.formState.errors?.exercises?.[exerciseIndex]
                            ?.sets?.[setIndex];
                        const setErrorMsg =
                          setErrors?.reps?.message ??
                          setErrors?.weight?.message ??
                          setErrors?.duration?.message;
                        const rpeKey = `${exerciseIndex}-${setIndex}`;
                        const rpeValue = form.watch(
                          `exercises.${exerciseIndex}.sets.${setIndex}.rpe` as `exercises.${number}.sets.${number}.rpe`
                        ) as number | null | undefined;
                        const rpeDisplayValue =
                          rpeSliderDisplayBySet[rpeKey] ?? rpeValue ?? 5;
                        return (
                          <div key={set.id} className="flex flex-col min-w-0">
                            <div className="flex items-end gap-1 min-w-0">
                              {!isTemplateMode && (
                                <FormField
                                  control={form.control}
                                  name={`exercises.${exerciseIndex}.sets.${setIndex}.isChecked`}
                                  render={({ field }) => (
                                    <FormItem className="shrink-0 pb-2">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          tabIndex={-1}
                                          checked={field.value ?? false}
                                          onChange={(e) =>
                                            field.onChange(e.target.checked)
                                          }
                                          disabled={isPending}
                                          className="h-5 w-5 shrink-0 appearance-none rounded-full border border-secondary-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 checked:bg-success/10 checked:border-success accent-success"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              )}
                              <div className="w-14 shrink-0 min-w-0">
                                <FormLabel>Set</FormLabel>
                                <Input
                                  type="text"
                                  autoComplete="off"
                                  disabled={true}
                                  readOnly
                                  value={set.set_number || setIndex + 1}
                                  data-form-field="false"
                                  className="bg-background cursor-default w-full"
                                />
                              </div>
                              {(() => {
                                const unitType =
                                  (form.watch(
                                    `exercises.${exerciseIndex}.unitType`
                                  ) as WorkoutUnitType | undefined) ??
                                  WORKOUT_UNIT_TYPE.REPS_BASED;

                                // TIME-BASED: Duration + Weight, bez Reps (Reps zapisuje się jako 0).
                                if (unitType === WORKOUT_UNIT_TYPE.DURATION) {
                                  return (
                                    <>
                                      <FormField
                                        control={form.control}
                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.duration`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1 min-w-0">
                                            <FormLabel>Duration [s]</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step={1}
                                                min={0}
                                                autoComplete="off"
                                                disabled={isPending}
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                  field.onChange(e.target.value)
                                                }
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1 min-w-0">
                                            <FormLabel>Weight [kg]</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step={0.1}
                                                min={0}
                                                autoComplete="off"
                                                disabled={isPending}
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                  field.onChange(e.target.value)
                                                }
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    </>
                                  );
                                }

                                // REPS-BASED: Reps + Weight.
                                return (
                                  <>
                                    <FormField
                                      control={form.control}
                                      name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1 min-w-0">
                                          <FormLabel>Reps</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step={1}
                                              min={0}
                                              autoComplete="off"
                                              disabled={isPending}
                                              {...field}
                                              value={field.value ?? ""}
                                              onChange={(e) =>
                                                field.onChange(e.target.value)
                                              }
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1 min-w-0">
                                          <FormLabel>Weight [kg]</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step={0.1}
                                              min={0}
                                              autoComplete="off"
                                              disabled={isPending}
                                              {...field}
                                              value={field.value ?? ""}
                                              onChange={(e) =>
                                                field.onChange(e.target.value)
                                              }
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </>
                                );
                              })()}

                              {!isTemplateMode && (
                                <RpeToggleButton
                                  control={form.control}
                                  exerciseIndex={exerciseIndex}
                                  setIndex={setIndex}
                                  rpeOpenBySet={rpeOpenBySet}
                                  isPending={isPending}
                                  onToggle={toggleRpePanel}
                                />
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRemoveSetClick(exerciseIndex, setIndex)
                                }
                                disabled={isPending}
                                className="text-destructive size-4 hover:text-destructive shrink-0 min-w-0 p-0.5 mb-2"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                            {!isTemplateMode && rpeOpenBySet[rpeKey] && (
                              <RpeSliderPanel
                                rpeValue={rpeValue}
                                displayValue={rpeDisplayValue}
                                isPending={isPending}
                                onValueChange={(val) => {
                                  setRpeDisplay(rpeKey, val);
                                  form.setValue(
                                    `exercises.${exerciseIndex}.sets.${setIndex}.rpe` as `exercises.${number}.sets.${number}.rpe`,
                                    val
                                  );
                                }}
                                onClear={() => {
                                  form.setValue(
                                    `exercises.${exerciseIndex}.sets.${setIndex}.rpe` as `exercises.${number}.sets.${number}.rpe`,
                                    null
                                  );
                                  clearRpeDisplay(rpeKey);
                                }}
                              />
                            )}
                            {setErrorMsg && (
                              <p className="text-destructive text-sm mt-1 text-center">
                                {setErrorMsg}
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 py-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSet(exerciseIndex)}
                      disabled={
                        isPending ||
                        !(form.watch(`exercises.${exerciseIndex}.name`) ?? "")
                          .toString()
                          .trim()
                      }
                      className={`gap-2 shrink-0 w-[5.75rem]`}
                    >
                      <Plus className="h-4 w-4" />
                      Add Set
                    </Button>

                    <div className="flex items-center gap-1">
                      {!isTemplateMode && <div className="w-[3.5rem] shrink-0" />}
                      <div className="size-4 shrink-0" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveExerciseClick(exerciseIndex)}
                      disabled={isPending}
                      className="gap-2 min-w-0 text-muted-foreground hover:text-primary w-[10rem]"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      Remove Exercise
                    </Button>
                  </div>
                  {exerciseIndex < exerciseFields.length - 1 &&
                    hasExerciseChanges(exerciseIndex) && (
                      <Button
                        type="button"
                        variant="default"
                        disabled={isPending}
                        onClick={() => submitForm()}
                        className="mt-2 w-full"
                      >
                        {isPending ? <Loader /> : submitLabel}
                      </Button>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>

          {isError && (
            <FormMessage className="text-primary-element text-center">
              {error?.message || "Failed to save workout. Please try again."}
            </FormMessage>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddExercise()}
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              variant="default"
              disabled={isPending || !hasFormChanges()}
            >
              {isPending ? <Loader /> : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardWorkoutClick}
              disabled={isPending}
            >
              {isTemplateMode ? "Discard Template" : "Discard Workout"}{" "}
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </form>

      <ConfirmModal
        open={isDiscardWorkoutModalOpen}
        onOpenChange={setIsDiscardWorkoutModalOpen}
        title={isTemplateMode ? "Discard template?" : "Discard workout?"}
        description={
          currentEntityId
            ? isTemplateMode
              ? "This will permanently delete this template. This action cannot be undone."
              : "This will permanently delete this workout. This action cannot be undone."
            : "This will clear the form. Your unsaved changes will be lost."
        }
        confirmLabel="Discard"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDiscard}
        isPending={isTemplateMode ? isDeletingTemplate : isDeleting}
      />

      <ConfirmModal
        open={removeExerciseModal.open}
        onOpenChange={(open) =>
          !open && setRemoveExerciseModal({ open: false, exerciseIndex: null })
        }
        title="Remove exercise?"
        description="This exercise will be removed from the workout. This action will be saved to the workout."
        confirmLabel="Remove"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemoveExercise}
        isPending={isUpdating}
      />

      <ConfirmModal
        open={removeSetModal.open}
        onOpenChange={(open) =>
          !open &&
          setRemoveSetModal({
            open: false,
            exerciseIndex: null,
            setIndex: null,
          })
        }
        title="Remove set?"
        description="This set will be removed from the exercise. This action will be saved to the workout."
        confirmLabel="Remove"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemoveSet}
        isPending={isUpdating}
      />

    </Form>
  );
};
