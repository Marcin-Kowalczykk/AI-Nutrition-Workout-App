"use client";

//libs
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, subDays } from "date-fns";

//hooks
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect } from "react";
import { useWorkoutFormState } from "./hooks/use-workout-form-state";
import { useWorkoutFormCache } from "./hooks/use-workout-form-cache";
import { useWorkoutFormData } from "./hooks/use-workout-form-data";
import { useWorkoutFormSubmit } from "./hooks/use-workout-form-submit";
import { useWorkoutExerciseOps } from "./hooks/use-workout-exercise-ops";

//components
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
import { NativeCheckbox } from "@/components/shared/native-checkbox";
import { Loader } from "@/components/shared/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenterWrapper from "@/components/shared/center-wrapper";
import { ConfirmModal } from "../shared/confirm-modal";
import { ExercisesSelect } from "@/components/shared/exercises-select";
import { DatePicker } from "@/components/shared/date-picker";
import { RpeToggleButton, RpeSliderPanel, useRpeState } from "./form/rpe";

//types
import type { Resolver } from "react-hook-form";
import {
  CreateWorkoutFormType,
  createWorkoutFormSchema,
  templateWorkoutFormSchema,
  WORKOUT_UNIT_TYPE,
  type WorkoutUnitType,
} from "./types";
import { useWorkoutUnsavedChanges } from "./context/workout-unsaved-context";
import {
  ExerciseHistoryStrip,
  ExerciseHistoryStripContent,
} from "./form/exercise-history-strip/exercise-history-strip";

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
  const {
    workoutId, setWorkoutId,
    templateId, setTemplateId,
    isFirstSave, setIsFirstSave,
    isDiscardWorkoutModalOpen, setIsDiscardWorkoutModalOpen,
    removeExerciseModal, setRemoveExerciseModal,
    removeSetModal, setRemoveSetModal,
    historyOpenByExerciseId, setHistoryOpenByExerciseId,
    headerVisible, setHeaderVisible,
  } = useWorkoutFormState({ initialWorkoutId, initialTemplateId, isTemplateMode });
  const currentEntityId = isTemplateMode ? templateId : workoutId;
  const {
    rpeOpenBySet,
    rpeSliderDisplayBySet,
    toggleRpePanel,
    clearRpeDisplay,
    setRpeDisplay,
  } = useRpeState();
  const { setHasUnsavedChanges, discardRef } = useWorkoutUnsavedChanges();

  const baseCacheKey = isTemplateMode
    ? TEMPLATE_FORM_CACHE_KEY
    : WORKOUT_FORM_CACHE_KEY;
  const entityCacheId = isTemplateMode ? initialTemplateId : initialWorkoutId;
  const cacheKey = entityCacheId
    ? `${baseCacheKey}:${entityCacheId}`
    : baseCacheKey;

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

  const formValues = form.watch();
  const { clearCache } = useWorkoutFormCache({ form, cacheKey, discardRef, formValues });

  const {
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
  } = useWorkoutFormSubmit({
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
  });

  const { isLoadingWorkout, isLoadingTemplate } = useWorkoutFormData({
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
  });

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const {
    applyUnitChange,
    mapExerciseUnitToWorkoutUnit,
    handleAddExercise,
    handleRemoveExerciseClick,
    handleConfirmRemoveExercise,
    handleAddSet,
    handleRemoveSetClick,
    handleConfirmRemoveSet,
  } = useWorkoutExerciseOps({
    form,
    currentEntityId,
    isTemplateMode,
    appendExercise,
    removeExercise,
    setBaselineFromValues,
    setRemoveExerciseModal,
    setRemoveSetModal,
    removeExerciseModal,
    removeSetModal,
    saveToServer,
  });

  useEffect(() => {
    const hasChanges = hasFormChanges();
    setHasUnsavedChanges(hasChanges);

    return () => {
      setHasUnsavedChanges(false);
    };
  }, [formValues, hasFormChanges, setHasUnsavedChanges]);

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
                        const isChecked =
                          (form.watch(
                            `exercises.${exerciseIndex}.sets.${setIndex}.isChecked` as `exercises.${number}.sets.${number}.isChecked`
                          ) as boolean | undefined) ?? false;

                        return (
                          <div key={set.id} className="flex flex-col min-w-0">
                            <div
                              className={cn(
                                "flex items-center gap-1.5 rounded-lg border px-2 py-1.5",
                                !isTemplateMode && isChecked
                                  ? "border-success/[0.27] bg-success/[0.06]"
                                  : "border-border bg-muted"
                              )}
                            >
                              {!isTemplateMode && (
                                <FormField
                                  control={form.control}
                                  name={`exercises.${exerciseIndex}.sets.${setIndex}.isChecked`}
                                  render={({ field }) => (
                                    <FormItem className="shrink-0 mt-4">
                                      <FormControl>
                                        <NativeCheckbox
                                          checked={field.value ?? false}
                                          onChange={field.onChange}
                                          disabled={isPending}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              )}
                              <div
                                className={cn(
                                  "mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                                  !isTemplateMode && isChecked
                                    ? "border-success/40 bg-success/10 text-success"
                                    : "border-border bg-accent text-muted-foreground"
                                )}
                              >
                                {set.set_number || setIndex + 1}
                              </div>
                              {(() => {
                                const unitType =
                                  (form.watch(
                                    `exercises.${exerciseIndex}.unitType`
                                  ) as WorkoutUnitType | undefined) ??
                                  WORKOUT_UNIT_TYPE.REPS_BASED;

                                if (unitType === WORKOUT_UNIT_TYPE.DURATION) {
                                  return (
                                    <>
                                      <FormField
                                        control={form.control}
                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.duration`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1 min-w-0 space-y-1">
                                            <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">
                                              Duration s
                                            </FormLabel>
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
                                                className="text-center font-bold"
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1 min-w-0 space-y-1">
                                            <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">
                                              Weight kg
                                            </FormLabel>
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
                                                className="text-center font-bold"
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    </>
                                  );
                                }

                                return (
                                  <>
                                    <FormField
                                      control={form.control}
                                      name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1 min-w-0 space-y-1">
                                          <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">
                                            Reps
                                          </FormLabel>
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
                                              className="text-center font-bold"
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1 min-w-0 space-y-1">
                                          <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">
                                            Weight kg
                                          </FormLabel>
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
                                              className="text-center font-bold"
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
                                className="mt-5 text-destructive size-4 hover:text-destructive shrink-0 min-w-0 p-0.5"
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
                              <p className="mt-0.5 text-center text-sm text-destructive">
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
