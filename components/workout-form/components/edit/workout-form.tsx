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

// types and schemas
import { CreateWorkoutFormType, createWorkoutFormSchema } from "../../types";

const WORKOUT_FORM_CACHE_KEY = "workout-form-draft";

interface WorkoutFormProps {
  workoutId?: string | null;
}

export const WorkoutForm = ({
  workoutId: initialWorkoutId,
}: WorkoutFormProps) => {
  const [workoutId, setWorkoutId] = useState<string | null>(
    initialWorkoutId || null
  );
  const [isFirstSave, setIsFirstSave] = useState(!initialWorkoutId);
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

  const { data: workoutData, isLoading: isLoadingWorkout } = useGetWorkout({
    workoutId: initialWorkoutId || null,
    enabled: !!initialWorkoutId,
  });

  // Save to cache
  const saveToCache = useCallback((data: CreateWorkoutFormType) => {
    try {
      localStorage.setItem(WORKOUT_FORM_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving workout form to cache:", error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(WORKOUT_FORM_CACHE_KEY);
    } catch (error) {
      console.error("Error clearing workout form cache:", error);
    }
  }, []);

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
      form.reset({
        name: "",
        description: "",
        exercises: [],
      });
      setWorkoutId(null);
      setIsFirstSave(true);
      setIsDiscardWorkoutModalOpen(false);
      toast.success("Workout discarded");
    },
    onError: (error) => {
      toast.error(error || "Failed to delete workout. Please try again.");
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
    if (initialWorkoutId) return;

    try {
      const cached = localStorage.getItem(WORKOUT_FORM_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        form.reset(parsed);
      }
    } catch (error) {
      console.error("Error loading cached workout form:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Transform workout data to form format
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

  const isPending = isCreating || isUpdating || isDeleting || isLoadingWorkout;
  const isError = isCreateError || isUpdateError;
  const error = createError || updateError;

  if (isLoadingWorkout && initialWorkoutId)
    return (
      <CenterWrapper>
        <Loader />
      </CenterWrapper>
    );

  const handleAddExercise = () => {
    appendExercise({
      id: crypto.randomUUID(),
      name: "",
      sets: [],
    });
  };

  const handleRemoveExerciseClick = (exerciseIndex: number) => {
    if (workoutId) {
      setRemoveExerciseModal({ open: true, exerciseIndex });
    } else {
      removeExercise(exerciseIndex);
    }
  };

  const handleConfirmRemoveExercise = () => {
    const exerciseIndex = removeExerciseModal.exerciseIndex;
    if (exerciseIndex === null || !workoutId) return;

    const values = form.getValues();
    const newExercises = values.exercises.filter((_, i) => i !== exerciseIndex);
    const prepared = prepareExercisesForSubmission(newExercises);

    updateWorkout(
      {
        id: workoutId,
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
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = form.getValues(`exercises.${exerciseIndex}`);
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
    if (workoutId) {
      setRemoveSetModal({ open: true, exerciseIndex, setIndex });
    } else {
      doRemoveSetFromForm(exerciseIndex, setIndex);
    }
  };

  const handleConfirmRemoveSet = () => {
    const { exerciseIndex, setIndex } = removeSetModal;
    if (exerciseIndex === null || setIndex === null || !workoutId) return;

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

    updateWorkout(
      {
        id: workoutId,
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
  };

  const handleDiscardWorkoutClick = () => {
    setIsDiscardWorkoutModalOpen(true);
  };

  const handleConfirmDiscard = () => {
    if (workoutId) {
      deleteWorkout(workoutId);
    } else {
      clearCache();
      form.reset({
        name: "",
        description: "",
        exercises: [],
      });
      setWorkoutId(null);
      setIsFirstSave(true);
      setIsDiscardWorkoutModalOpen(false);
      toast.success("Workout discarded");
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

  const onSubmitHandler = async (values: CreateWorkoutFormType) => {
    const { name, description, exercises } = values;
    const currentDate = new Date().toISOString();
    const filteredExercises = prepareExercisesForSubmission(exercises);

    if (isFirstSave && !workoutId) {
      createWorkout({
        name,
        description: description || undefined,
        start_date: currentDate,
        exercises: filteredExercises.length > 0 ? filteredExercises : undefined,
      });
    } else if (workoutId) {
      updateWorkout({
        id: workoutId,
        name,
        description: description || undefined,
        end_date: currentDate,
        exercises: filteredExercises.length > 0 ? filteredExercises : undefined,
      });
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
                <FormLabel>Workout Name*</FormLabel>
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
                            <Input
                              {...field}
                              placeholder="Exercise name"
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
                <CardContent className="flex flex-col gap-4">
                  {(form.watch(`exercises.${exerciseIndex}.sets`) ?? []).map(
                    (set, setIndex) => (
                      <div key={set.id} className="flex items-center gap-2 ">
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
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined
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
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined
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
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined
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
                      disabled={isPending}
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
                "Save Workout"
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
              Discard Workout <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </form>

      <ConfirmModal
        open={isDiscardWorkoutModalOpen}
        onOpenChange={setIsDiscardWorkoutModalOpen}
        title="Discard workout?"
        description={
          workoutId
            ? "This will permanently delete this workout. This action cannot be undone."
            : "This will clear the form. Your unsaved changes will be lost."
        }
        confirmLabel="Discard"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDiscard}
        isPending={isDeleting}
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
