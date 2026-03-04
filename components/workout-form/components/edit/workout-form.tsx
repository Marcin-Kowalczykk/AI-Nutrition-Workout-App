"use client";

// dependencies
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

// hooks
import { useFieldArray } from "react-hook-form";
import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader } from "@/components/shared/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenterWrapper from "@/components/shared/center-wrapper";
import { ConfirmModal } from "../../../shared/confirm-modal";
import { ExercisesSelect } from "@/components/shared/exercises-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// types and schemas
import { getFormCache, removeFormCache, setFormCache } from "@/lib/form-cache";
import { formatNumberFieldValue, parseNumberInput } from "@/lib/number-input";
import {
  CreateWorkoutFormType,
  createWorkoutFormSchema,
  WORKOUT_UNIT_TYPE,
  type WorkoutUnitType,
} from "../../types";
import { normalizeForComparison } from "@/lib/normalize-string";
import { useWorkoutUnsavedChanges } from "../../context/workout-unsaved-context";
import { ExerciseHistoryStrip } from "./exercise-history-strip/exercise-history-strip";
import type {
  IWorkoutTemplateExerciseItem,
  IWorkoutTemplateSetItem,
} from "@/app/api/workout-templates/types";
import {
  getBaselineString,
  inferUnitType,
  prepareExercisesForSubmission,
  prepareExercisesForTemplate,
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
  const [changeUnitModal, setChangeUnitModal] = useState<{
    open: boolean;
    exerciseIndex: number | null;
    newUnit: WorkoutUnitType | null;
  }>({ open: false, exerciseIndex: null, newUnit: null });
  const [unitSelectVisibleByExerciseId, setUnitSelectVisibleByExerciseId] =
    useState<Record<string, boolean>>({});
  const [historyOpenByExerciseId, setHistoryOpenByExerciseId] = useState<
    Record<string, boolean>
  >({});
  const [numberInputEditing, setNumberInputEditing] = useState<
    Record<string, string>
  >({});
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
  const { setHasUnsavedChanges } = useWorkoutUnsavedChanges();

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
      form.reset({ name: "", description: "", exercises: [] });
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

  const form = useForm<CreateWorkoutFormType>({
    resolver: zodResolver(createWorkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      description: "",
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
          form.reset(parsed);
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
      exercises: (prefillTemplateData.exercises || []).map(
        (exercise: IWorkoutTemplateExerciseItem) => {
          const sets = (exercise.sets || []).map(
            (set: IWorkoutTemplateSetItem) => ({
              id: set.id,
              set_number: set.set_number || 0,
              reps: set.reps,
              weight: set.weight,
              duration: set.duration,
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
  }, [
    prefillFromTemplateId,
    prefillTemplateData,
    isTemplateMode,
    initialWorkoutId,
    form,
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
      exercises: (workoutData.exercises || []).map((exercise) => {
        const sets = (exercise.sets || []).map((set) => ({
          id: set.id,
          set_number: set.set_number || 0,
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          isChecked: set.isChecked || false,
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
    setLastSavedBaseline(getBaselineString(formData, false));
    lastSavedExercisesRef.current = formData.exercises;
    (async () => {
      try {
        const cached = await getFormCache(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          form.reset(parsed);
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
              reps: set.reps,
              weight: set.weight,
              duration: set.duration,
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
    setLastSavedBaseline(getBaselineString(formData, true));
    lastSavedExercisesRef.current = formData.exercises;
    (async () => {
      try {
        const cached = await getFormCache(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          form.reset(parsed);
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
    const currentBaseline = getBaselineString(values, isTemplateMode);

    if (lastSavedBaseline === null) {
      const emptyBaseline = JSON.stringify({
        name: "",
        description: "",
        exercises: [],
      });
      return currentBaseline !== emptyBaseline;
    }

    return currentBaseline !== lastSavedBaseline;
  }, [form, isTemplateMode, lastSavedBaseline]);

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
            s.reps !== undefined ||
            s.weight !== undefined ||
            s.duration !== undefined
        );
        return hasName || hasSets;
      }

      const savedExercise = saved.find((e) => e.id === current.id);
      if (!savedExercise) return true;

      return (
        JSON.stringify({
          name: current.name,
          unitType: current.unitType,
          sets: current.sets,
        }) !==
        JSON.stringify({
          name: savedExercise.name,
          unitType: savedExercise.unitType,
          sets: savedExercise.sets,
        })
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
      setLastSavedBaseline(getBaselineString(values, isTemplateMode));
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

  const onSubmitHandler = async (values: CreateWorkoutFormType) => {
    const { name, description, exercises } = values;
    const currentDate = new Date().toISOString();
    const filteredExercises = prepareExercisesForSubmission(exercises);

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
          weight: undefined,
          duration: undefined,
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

  const handleUnitTypeChange = (
    exerciseIndex: number,
    newUnit: WorkoutUnitType
  ) => {
    const currentUnit: WorkoutUnitType =
      form.getValues(`exercises.${exerciseIndex}.unitType`) ??
      WORKOUT_UNIT_TYPE.WEIGHT;
    if (newUnit === currentUnit) return;

    const sets = form.getValues(`exercises.${exerciseIndex}.sets`) ?? [];
    const hasValues =
      currentUnit === WORKOUT_UNIT_TYPE.WEIGHT
        ? sets.some((s) => s.weight !== undefined && s.weight !== null)
        : sets.some((s) => s.duration !== undefined && s.duration !== null);

    if (hasValues) {
      setChangeUnitModal({ open: true, exerciseIndex, newUnit });
    } else {
      applyUnitChange(exerciseIndex, newUnit);
    }
  };

  const handleConfirmChangeUnit = () => {
    const { exerciseIndex, newUnit } = changeUnitModal;
    if (exerciseIndex === null || newUnit === null) return;
    applyUnitChange(exerciseIndex, newUnit);
    setChangeUnitModal({ open: false, exerciseIndex: null, newUnit: null });
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
      unitType: WORKOUT_UNIT_TYPE.WEIGHT,
      sets: [],
    });
  };

  const handleRemoveExerciseClick = (exerciseIndex: number) => {
    if (currentEntityId) {
      setRemoveExerciseModal({ open: true, exerciseIndex });
    } else {
      removeExercise(exerciseIndex);
    }
  };

  const handleConfirmRemoveExercise = () => {
    const exerciseIndex = removeExerciseModal.exerciseIndex;
    if (exerciseIndex === null || !currentEntityId) return;

    const values = form.getValues();
    const newExercises = values.exercises.filter((_, i) => i !== exerciseIndex);
    const prepared = prepareExercisesForSubmission(newExercises);

    const newValues = {
      name: values.name,
      description: values.description,
      exercises: newExercises,
    };

    if (isTemplateMode) {
      updateTemplate(
        {
          id: currentEntityId,
          name: values.name,
          description: values.description,
          exercises: prepared.length > 0 ? prepared : undefined,
        },
        {
          onSuccess: () => {
            removeExercise(exerciseIndex);
            setRemoveExerciseModal({ open: false, exerciseIndex: null });
            setBaselineFromValues(newValues);
          },
        }
      );
    } else {
      updateWorkout(
        {
          id: currentEntityId,
          name: values.name,
          description: values.description,
          end_date: new Date().toISOString(),
          exercises: prepared.length > 0 ? prepared : undefined,
        },
        {
          onSuccess: () => {
            removeExercise(exerciseIndex);
            setRemoveExerciseModal({ open: false, exerciseIndex: null });
            setBaselineFromValues(newValues);
          },
        }
      );
    }
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
        reps: undefined,
        weight: undefined,
        duration: undefined,
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

    const newValues = {
      name: values.name,
      description: values.description,
      exercises: newExercises,
    };

    if (isTemplateMode) {
      updateTemplate(
        {
          id: currentEntityId,
          name: values.name,
          description: values.description,
          exercises: prepared.length > 0 ? prepared : undefined,
        },
        {
          onSuccess: () => {
            doRemoveSetFromForm(exerciseIndex, setIndex);
            setRemoveSetModal({
              open: false,
              exerciseIndex: null,
              setIndex: null,
            });
            setBaselineFromValues(newValues);
          },
        }
      );
    } else {
      updateWorkout(
        {
          id: currentEntityId,
          name: values.name,
          description: values.description,
          end_date: new Date().toISOString(),
          exercises: prepared.length > 0 ? prepared : undefined,
        },
        {
          onSuccess: () => {
            doRemoveSetFromForm(exerciseIndex, setIndex);
            setRemoveSetModal({
              open: false,
              exerciseIndex: null,
              setIndex: null,
            });
            setBaselineFromValues(newValues);
          },
        }
      );
    }
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
      form.reset({ name: "", description: "", exercises: [] });
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
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
                      <Input
                        {...field}
                        type="text"
                        autoComplete="off"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description for your workout
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FormLabel>Exercises</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExercise}
                disabled={isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Exercise
              </Button>
            </div>

            {exerciseFields.map((exercise, exerciseIndex) => (
              <Card key={exercise.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start space-y-0 p-2">
                  <CardTitle className="flex w-full items-center gap-1 min-w-0">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => form.handleSubmit(onSubmitHandler)()}
                      disabled={isPending || !hasExerciseChanges(exerciseIndex)}
                      className={`shrink-0 size-8 min-w-0 ${
                        hasExerciseChanges(exerciseIndex)
                          ? "ring-1 ring-destructive ring-offset-2 ring-offset-background"
                          : ""
                      }`}
                      aria-label="Save workout"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <FormField
                        control={form.control}
                        name={`exercises.${exerciseIndex}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl className="w-full">
                              <ExercisesSelect
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-w-0 flex-col gap-3 p-2 pt-0">
                  {(() => {
                    const unitOpen =
                      unitSelectVisibleByExerciseId[exercise.id] === true;
                    const historyOpen =
                      historyOpenByExerciseId[exercise.id] === true;
                    const historyStrip = (
                      <ExerciseHistoryStrip
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
                    );
                    const unitButton = (
                      <Button
                        type="button"
                        variant="showHide"
                        size="showHide"
                        className="shrink-0"
                        onClick={() =>
                          setUnitSelectVisibleByExerciseId((prev) => ({
                            ...prev,
                            [exercise.id]: !prev[exercise.id],
                          }))
                        }
                      >
                        <span className="flex items-center gap-1">
                          {unitOpen ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : (
                            <ChevronLeft className="h-3 w-3" />
                          )}
                          <span>Unit</span>
                        </span>
                      </Button>
                    );
                    if (unitOpen) {
                      return (
                        <>
                          <div className="min-w-0">{historyStrip}</div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <FormField
                              control={form.control}
                              name={`exercises.${exerciseIndex}.unitType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only">
                                    Unit
                                  </FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      value={
                                        field.value ?? WORKOUT_UNIT_TYPE.WEIGHT
                                      }
                                      onValueChange={(value: WorkoutUnitType) =>
                                        handleUnitTypeChange(
                                          exerciseIndex,
                                          value
                                        )
                                      }
                                      className="flex flex-row gap-4"
                                    >
                                      <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                          value={WORKOUT_UNIT_TYPE.WEIGHT}
                                          id={`${exercise.id}-${WORKOUT_UNIT_TYPE.WEIGHT}`}
                                        />
                                        <Label
                                          htmlFor={`${exercise.id}-${WORKOUT_UNIT_TYPE.WEIGHT}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          Weight
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                          value={WORKOUT_UNIT_TYPE.DURATION}
                                          id={`${exercise.id}-${WORKOUT_UNIT_TYPE.DURATION}`}
                                        />
                                        <Label
                                          htmlFor={`${exercise.id}-${WORKOUT_UNIT_TYPE.DURATION}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          Duration
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {unitButton}
                          </div>
                        </>
                      );
                    }
                    return (
                      <>
                        <div className="flex flex-nowrap items-center justify-between gap-2 min-w-0">
                          <div
                            className={
                              historyOpen
                                ? "min-w-0 flex-1 overflow-hidden"
                                : "w-fit min-w-0 shrink-0"
                            }
                          >
                            {historyStrip}
                          </div>
                          {!historyOpen && unitButton}
                        </div>
                        {historyOpen && (
                          <div className="flex justify-end">{unitButton}</div>
                        )}
                      </>
                    );
                  })()}
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
                        return (
                          <div key={set.id} className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              {!isTemplateMode && (
                                <FormField
                                  control={form.control}
                                  name={`exercises.${exerciseIndex}.sets.${setIndex}.isChecked`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center shrink-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value ?? false}
                                          onCheckedChange={field.onChange}
                                          disabled={isPending}
                                          className="h-5 w-5 border-secondary-foreground [&>svg]:h-4 [&>svg]:w-4 data-[state=checked]:bg-secondary-success data-[state=checked]:border-success data-[state=checked]:text-success mt-7"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              )}
                              <div className="w-14 shrink-0 min-w-0 ml-3">
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
                              <FormField
                                control={form.control}
                                name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                                render={({ field }) => (
                                  <FormItem className="flex-1 min-w-0">
                                    <FormLabel>Reps</FormLabel>
                                    <FormControl>
                                      <Input
                                        ref={field.ref}
                                        name={field.name}
                                        type="number"
                                        step="any"
                                        min={0}
                                        autoComplete="off"
                                        disabled={isPending}
                                        value={
                                          numberInputEditing[field.name] !==
                                          undefined
                                            ? numberInputEditing[field.name]
                                            : formatNumberFieldValue(
                                                field.value
                                              )
                                        }
                                        onChange={(
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const raw = e.target.value;
                                          setNumberInputEditing((prev) => ({
                                            ...prev,
                                            [field.name]: raw,
                                          }));
                                          field.onChange(parseNumberInput(raw));
                                        }}
                                        onBlur={() => {
                                          setNumberInputEditing((prev) => {
                                            const next = { ...prev };
                                            delete next[field.name];
                                            return next;
                                          });
                                          field.onBlur();
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              {(form.watch(
                                `exercises.${exerciseIndex}.unitType`
                              ) ?? WORKOUT_UNIT_TYPE.WEIGHT) ===
                              WORKOUT_UNIT_TYPE.WEIGHT ? (
                                <FormField
                                  control={form.control}
                                  name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1 min-w-0">
                                      <FormLabel>Weight [kg]</FormLabel>
                                      <FormControl>
                                        <Input
                                          ref={field.ref}
                                          name={field.name}
                                          type="number"
                                          step="any"
                                          min={0}
                                          autoComplete="off"
                                          disabled={isPending}
                                          value={
                                            numberInputEditing[field.name] !==
                                            undefined
                                              ? numberInputEditing[field.name]
                                              : formatNumberFieldValue(
                                                  field.value
                                                )
                                          }
                                          onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const raw = e.target.value;
                                            setNumberInputEditing((prev) => ({
                                              ...prev,
                                              [field.name]: raw,
                                            }));
                                            field.onChange(
                                              parseNumberInput(raw)
                                            );
                                          }}
                                          onBlur={() => {
                                            setNumberInputEditing((prev) => {
                                              const next = { ...prev };
                                              delete next[field.name];
                                              return next;
                                            });
                                            field.onBlur();
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <FormField
                                  control={form.control}
                                  name={`exercises.${exerciseIndex}.sets.${setIndex}.duration`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1 min-w-0">
                                      <FormLabel>Duration [s]</FormLabel>
                                      <FormControl>
                                        <Input
                                          ref={field.ref}
                                          name={field.name}
                                          type="number"
                                          step="any"
                                          min={0}
                                          autoComplete="off"
                                          disabled={isPending}
                                          value={
                                            numberInputEditing[field.name] !==
                                            undefined
                                              ? numberInputEditing[field.name]
                                              : formatNumberFieldValue(
                                                  field.value
                                                )
                                          }
                                          onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const raw = e.target.value;
                                            setNumberInputEditing((prev) => ({
                                              ...prev,
                                              [field.name]: raw,
                                            }));
                                            field.onChange(
                                              parseNumberInput(raw)
                                            );
                                          }}
                                          onBlur={() => {
                                            setNumberInputEditing((prev) => {
                                              const next = { ...prev };
                                              delete next[field.name];
                                              return next;
                                            });
                                            field.onBlur();
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
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
                                className="text-destructive size-4 hover:text-destructive shrink-0 min-w-0 p-0.5 mt-6"
                              >
                                <Trash2 />
                              </Button>
                            </div>
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

                  <div className="flex items-center gap-2 justify-between">
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
                      className="gap-2 self-start"
                    >
                      <Plus className="h-4 w-4" />
                      Add Set
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveExerciseClick(exerciseIndex)}
                      disabled={isPending}
                      className="gap-2 self-start text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Exercise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isError && (
            <FormMessage className="text-destructive text-center">
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
              variant="destructive"
              disabled={isPending || !hasFormChanges()}
            >
              {isPending ? (
                <Loader />
              ) : isFirstSave ? (
                isTemplateMode ? (
                  "Save Template"
                ) : (
                  "Save Workout"
                )
              ) : isTemplateMode ? (
                "Update Template"
              ) : (
                "Update Workout"
              )}
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
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemoveSet}
        isPending={isUpdating}
      />

      <ConfirmModal
        open={changeUnitModal.open}
        onOpenChange={(open) =>
          !open &&
          setChangeUnitModal({
            open: false,
            exerciseIndex: null,
            newUnit: null,
          })
        }
        title="Change unit"
        description="Entered values (weight or duration) for this exercise will be removed. Do you want to continue?"
        confirmLabel="Yes, change"
        cancelLabel="Cancel"
        onConfirm={handleConfirmChangeUnit}
      />
    </Form>
  );
};
