"use client";

// dependencies
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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

// types and schemas
import { CreateWorkoutFormType, createWorkoutFormSchema } from "../../types";
import { ExerciseHistoryStrip } from "./exercise-history-strip";
import type {
  IWorkoutTemplateExerciseItem,
  IWorkoutTemplateSetItem,
} from "@/app/api/workout-templates/types";

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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const hasLoadedWorkoutDataRef = useRef(false);
  const hasLoadedTemplateDataRef = useRef(false);
  const lastPrefilledTemplateIdRef = useRef<string | null>(null);

  const cacheKey = isTemplateMode
    ? TEMPLATE_FORM_CACHE_KEY
    : WORKOUT_FORM_CACHE_KEY;

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

  // Save to cache
  const saveToCache = useCallback(
    (data: CreateWorkoutFormType) => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error("Error saving form to cache:", error);
      }
    },
    [cacheKey]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error("Error clearing form cache:", error);
    }
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
        setIsDiscardWorkoutModalOpen(false);
        toast.success("Template discarded");
      },
      onError: (error) => {
        toast.error(error || "Failed to delete template. Please try again.");
      },
    });

  const form = useForm<CreateWorkoutFormType>({
    resolver: zodResolver(createWorkoutFormSchema),
    defaultValues: {
      name: "",
      description: "",
      exercises: [],
    },
  });

  useEffect(() => {
    if (!isInitialMountRef.current) return;
    if (entityId) return;
    if (prefillFromTemplateId) return; // let prefill effect run first

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        form.reset(parsed);
      }
    } catch (error) {
      console.error("Error loading cached form:", error);
    }
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
        (exercise: IWorkoutTemplateExerciseItem) => ({
          id: exercise.id,
          name: exercise.name || "",
          sets: (exercise.sets || []).map((set: IWorkoutTemplateSetItem) => ({
            id: set.id,
            set_number: set.set_number || 0,
            reps: set.reps,
            weight: set.weight,
            duration: set.duration,
            isChecked: false,
          })),
        })
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
      exercises: (workoutData.exercises || []).map((exercise) => ({
        id: exercise.id,
        name: exercise.name || "",
        sets: (exercise.sets || []).map((set) => ({
          id: set.id,
          set_number: set.set_number || 0,
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          isChecked: set.isChecked || false,
        })),
      })),
    };

    form.reset(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutData, initialWorkoutId]);

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
        (exercise: IWorkoutTemplateExerciseItem) => ({
          id: exercise.id,
          name: exercise.name || "",
          sets: (exercise.sets || []).map((set: IWorkoutTemplateSetItem) => ({
            id: set.id,
            set_number: set.set_number || 0,
            reps: set.reps,
            weight: set.weight,
            duration: set.duration,
            isChecked: false,
          })),
        })
      ),
    };

    form.reset(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData, initialTemplateId]);

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

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

  if (
    (isLoadingWorkout && initialWorkoutId && !isTemplateMode) ||
    (isLoadingTemplate && initialTemplateId && isTemplateMode)
  ) {
    return (
      <CenterWrapper>
        <Loader />
      </CenterWrapper>
    );
  }

  const handleAddExercise = () => {
    appendExercise({
      id: crypto.randomUUID(),
      name: "",
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
      setIsDiscardWorkoutModalOpen(false);
      toast.success(
        isTemplateMode ? "Template discarded" : "Workout discarded"
      );
    }
  };

  const prepareExercisesForSubmission = (
    exercises: CreateWorkoutFormType["exercises"]
  ) => {
    return exercises
      .filter((exercise) => exercise.name || exercise.sets?.length > 0)
      .map((exercise) => {
        const filteredSets = exercise.sets
          .filter(
            (set) =>
              set.reps !== undefined ||
              set.weight !== undefined ||
              set.duration !== undefined
          )
          .map((set) => ({
            id: set.id,
            set_number: set.set_number ?? 0,
            reps: set.reps ?? 0,
            weight: set.weight,
            duration: set.duration,
            isChecked: set.isChecked ?? false,
          }));

        return {
          id: exercise.id,
          name: exercise.name ?? "",
          sets: filteredSets,
        };
      })
      .filter((exercise) => exercise.name || exercise.sets.length > 0);
  };

  const prepareExercisesForTemplate = (
    exercises: CreateWorkoutFormType["exercises"]
  ) => {
    return prepareExercisesForSubmission(exercises).map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map(({ isChecked, ...set }) => set),
    }));
  };

  const onSubmitHandler = async (values: CreateWorkoutFormType) => {
    const { name, description, exercises } = values;
    const currentDate = new Date().toISOString();
    const filteredExercises = prepareExercisesForSubmission(exercises);

    if (isTemplateMode) {
      const templateExercises = prepareExercisesForTemplate(exercises);
      if (isFirstSave && !currentEntityId) {
        createTemplate({
          name,
          description: description || undefined,
          exercises:
            templateExercises.length > 0 ? templateExercises : undefined,
        });
      } else if (currentEntityId) {
        updateTemplate({
          id: currentEntityId,
          name,
          description: description || undefined,
          exercises:
            templateExercises.length > 0 ? templateExercises : undefined,
        });
      }
    } else {
      if (isFirstSave && !workoutId) {
        createWorkout({
          name,
          description: description || undefined,
          start_date: currentDate,
          exercises:
            filteredExercises.length > 0 ? filteredExercises : undefined,
        });
      } else if (workoutId) {
        updateWorkout({
          id: workoutId,
          name,
          description: description || undefined,
          end_date: currentDate,
          exercises:
            filteredExercises.length > 0 ? filteredExercises : undefined,
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isTemplateMode ? "Template name" : "Workout Name"}*
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

          <div className="flex flex-col gap-4">
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
              <Card key={exercise.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="flex-1">
                    <FormField
                      control={form.control}
                      name={`exercises.${exerciseIndex}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
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
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveExerciseClick(exerciseIndex)}
                    disabled={isPending}
                    className="shrink-0 text-destructive hover:text-destructive"
                    aria-label="Remove exercise"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex min-w-0 flex-col gap-4">
                  <ExerciseHistoryStrip
                    exerciseName={
                      (form.watch(`exercises.${exerciseIndex}.name`) ?? "") ||
                      undefined
                    }
                  />
                  {(form.watch(`exercises.${exerciseIndex}.sets`) ?? []).map(
                    (set, setIndex) => (
                      <div key={set.id} className="flex items-center gap-2 ">
                        {!isTemplateMode && (
                          <FormField
                            control={form.control}
                            name={`exercises.${exerciseIndex}.sets.${setIndex}.isChecked`}
                            render={({ field }) => (
                              <FormItem className="flex items-center">
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
                        <div className="flex-1">
                          <FormLabel>Set</FormLabel>
                          <Input
                            type="text"
                            autoComplete="off"
                            disabled={true}
                            readOnly
                            value={set.set_number || setIndex + 1}
                            data-form-field="false"
                            className="bg-background cursor-default"
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Reps</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  autoComplete="off"
                                  disabled={isPending}
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Weight</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  autoComplete="off"
                                  disabled={isPending}
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`exercises.${exerciseIndex}.sets.${setIndex}.duration`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  autoComplete="off"
                                  disabled={isPending}
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveSetClick(exerciseIndex, setIndex)
                          }
                          disabled={isPending}
                          className="text-destructive hover:text-destructive pt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}

                  <div className="flex items-center gap-2 justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSet(exerciseIndex)}
                      disabled={
                        isPending ||
                        !(
                          (
                            form.watch(`exercises.${exerciseIndex}.name`) ??
                            ""
                          )
                            .toString()
                            .trim()
                        )
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
            <Button type="submit" variant="destructive" disabled={isPending}>
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
    </Form>
  );
};
