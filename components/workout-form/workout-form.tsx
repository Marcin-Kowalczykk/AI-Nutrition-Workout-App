"use client";

//libs
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

//hooks
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect } from "react";
import { useWorkoutFormState } from "./hooks/use-workout-form-state";
import { useWorkoutFormCache } from "./hooks/use-workout-form-cache";
import { useWorkoutFormData } from "./hooks/use-workout-form-data";
import { useWorkoutFormSubmit } from "./hooks/use-workout-form-submit";
import { useWorkoutExerciseOps } from "./hooks/use-workout-exercise-ops";

//components
import { Form, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";
import CenterWrapper from "@/components/shared/center-wrapper";
import { useRpeState } from "./form/rpe";
import { WorkoutFormHeader } from "./form/workout-form-header";
import { ExerciseRow } from "./form/exercise-row";
import { WorkoutFormModals } from "./form/workout-form-modals";

//types
import type { Resolver } from "react-hook-form";
import {
  CreateWorkoutFormType,
  createWorkoutFormSchema,
  templateWorkoutFormSchema,
} from "./types";
import { useWorkoutUnsavedChanges } from "./context/workout-unsaved-context";

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
  const rpeState = useRpeState();
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
    handleCopySet,
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
          <WorkoutFormHeader
            form={form}
            isTemplateMode={isTemplateMode}
            isPending={isPending}
            headerVisible={headerVisible}
            onToggleHeader={() => setHeaderVisible((v) => !v)}
          />

          <div className="flex flex-col gap-2">
            {exerciseFields.map((exercise, exerciseIndex) => (
              <ExerciseRow
                key={exercise.id}
                form={form}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                isTemplateMode={isTemplateMode}
                isPending={isPending}
                historyOpenByExerciseId={historyOpenByExerciseId}
                onHistoryChange={(id, open) =>
                  setHistoryOpenByExerciseId((prev) => ({ ...prev, [id]: open }))
                }
                onAddSet={handleAddSet}
                onCopySet={handleCopySet}
                onRemoveExercise={handleRemoveExerciseClick}
                onRemoveSet={handleRemoveSetClick}
                rpeState={rpeState}
                onSubmit={submitForm}
                submitLabel={submitLabel}
                hasExerciseChanges={hasExerciseChanges}
                isLastExercise={exerciseIndex === exerciseFields.length - 1}
                applyUnitChange={applyUnitChange}
                mapExerciseUnitToWorkoutUnit={mapExerciseUnitToWorkoutUnit}
              />
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

      <WorkoutFormModals
        isTemplateMode={isTemplateMode}
        currentEntityId={currentEntityId}
        isDiscardWorkoutModalOpen={isDiscardWorkoutModalOpen}
        onDiscardOpenChange={setIsDiscardWorkoutModalOpen}
        onConfirmDiscard={handleConfirmDiscard}
        isDeleting={isDeleting}
        isDeletingTemplate={isDeletingTemplate}
        removeExerciseModal={removeExerciseModal}
        onRemoveExerciseOpenChange={(open) => !open && setRemoveExerciseModal({ open: false, exerciseIndex: null })}
        onConfirmRemoveExercise={handleConfirmRemoveExercise}
        isUpdating={isUpdating}
        removeSetModal={removeSetModal}
        onRemoveSetOpenChange={(open) => !open && setRemoveSetModal({ open: false, exerciseIndex: null, setIndex: null })}
        onConfirmRemoveSet={handleConfirmRemoveSet}
      />
    </Form>
  );
};
