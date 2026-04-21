"use client";

//libs
import { useCallback } from "react";

//hooks
import type { UseFormReturn } from "react-hook-form";

//helpers
import { prepareExercisesForSubmission } from "../helpers";

//types
import type { CreateWorkoutFormType } from "../types";
import { WORKOUT_UNIT_TYPE, type WorkoutUnitType } from "../types";
import type { PreparedExercise } from "../helpers";
import type { ExerciseUnitType } from "@/app/api/exercises/types";
import type { WorkoutFormRemoveExerciseModal, WorkoutFormRemoveSetModal } from "./use-workout-form-state";

interface UseWorkoutExerciseOpsProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  currentEntityId: string | null;
  isTemplateMode: boolean;
  appendExercise: (exercise: CreateWorkoutFormType["exercises"][number]) => void;
  removeExercise: (index: number) => void;
  setBaselineFromValues: (values: CreateWorkoutFormType) => void;
  setRemoveExerciseModal: (state: WorkoutFormRemoveExerciseModal) => void;
  setRemoveSetModal: (state: WorkoutFormRemoveSetModal) => void;
  removeExerciseModal: WorkoutFormRemoveExerciseModal;
  removeSetModal: WorkoutFormRemoveSetModal;
  saveToServer: (values: CreateWorkoutFormType, prepared: PreparedExercise[], onSuccess: () => void) => void;
}

export const useWorkoutExerciseOps = ({
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
}: UseWorkoutExerciseOpsProps) => {
  const mapExerciseUnitToWorkoutUnit = (unitType: ExerciseUnitType | undefined): WorkoutUnitType => {
    if (unitType === "time-based") return WORKOUT_UNIT_TYPE.DURATION;
    return WORKOUT_UNIT_TYPE.REPS_BASED;
  };

  const applyUnitChange = useCallback(
    (exerciseIndex: number, newUnit: WorkoutUnitType) => {
      const values = form.getValues();
      const updatedExercises = (values.exercises ?? []).map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        return { ...exercise, unitType: newUnit, sets: (exercise.sets ?? []).map((set) => ({ ...set, weight: "", reps: "", duration: "" })) };
      });
      form.reset({ ...values, exercises: updatedExercises }, { keepDefaultValues: false });
    },
    [form]
  );

  const handleAddExercise = useCallback(() => {
    appendExercise({ id: crypto.randomUUID(), name: "", unitType: WORKOUT_UNIT_TYPE.REPS_BASED, sets: [] });
  }, [appendExercise]);

  const handleRemoveExerciseClick = useCallback(
    (exerciseIndex: number) => {
      if (currentEntityId) {
        setRemoveExerciseModal({ open: true, exerciseIndex });
      } else {
        removeExercise(exerciseIndex);
        setBaselineFromValues(form.getValues());
      }
    },
    [currentEntityId, setRemoveExerciseModal, removeExercise, setBaselineFromValues, form]
  );

  const handleConfirmRemoveExercise = useCallback(() => {
    const exerciseIndex = removeExerciseModal.exerciseIndex;
    if (exerciseIndex === null || !currentEntityId) return;
    const values = form.getValues();
    const newExercises = values.exercises.filter((_, i) => i !== exerciseIndex);
    const newValues: CreateWorkoutFormType = {
      name: values.name, description: values.description, exercises: newExercises,
      ...(isTemplateMode ? {} : { workout_date: values.workout_date ?? "" }),
    };
    saveToServer(values, prepareExercisesForSubmission(newExercises), () => {
      removeExercise(exerciseIndex);
      setRemoveExerciseModal({ open: false, exerciseIndex: null });
      setBaselineFromValues(newValues);
    });
  }, [removeExerciseModal, currentEntityId, form, isTemplateMode, saveToServer, removeExercise, setRemoveExerciseModal, setBaselineFromValues]);

  const handleAddSet = useCallback(
    (exerciseIndex: number) => {
      const exercise = form.getValues(`exercises.${exerciseIndex}`);
      if (!exercise?.name?.trim()) return;
      const currentSets = exercise?.sets ?? [];
      form.setValue(`exercises.${exerciseIndex}.sets`, [
        ...currentSets,
        { id: crypto.randomUUID(), set_number: currentSets.length + 1, reps: "", weight: "", duration: "", isChecked: false },
      ]);
    },
    [form]
  );

  const handleCopySet = useCallback(
    (exerciseIndex: number) => {
      const exercise = form.getValues(`exercises.${exerciseIndex}`);
      if (!exercise?.name?.trim()) return;
      const currentSets = exercise?.sets ?? [];
      const lastSet = currentSets[currentSets.length - 1];
      if (!lastSet) return;
      if (!lastSet.reps && !lastSet.weight && !lastSet.duration) return;
      form.setValue(`exercises.${exerciseIndex}.sets`, [
        ...currentSets,
        {
          id: crypto.randomUUID(),
          set_number: currentSets.length + 1,
          reps: lastSet.reps,
          weight: lastSet.weight,
          duration: lastSet.duration,
          rpe: lastSet.rpe ?? null,
          isChecked: false,
        },
      ]);
    },
    [form]
  );

  const doRemoveSetFromForm = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const currentSets = form.getValues(`exercises.${exerciseIndex}`)?.sets ?? [];
      form.setValue(
        `exercises.${exerciseIndex}.sets`,
        currentSets.filter((_, i) => i !== setIndex).map((set, i) => ({ ...set, set_number: i + 1 }))
      );
    },
    [form]
  );

  const handleRemoveSetClick = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      if (currentEntityId) {
        setRemoveSetModal({ open: true, exerciseIndex, setIndex });
      } else {
        doRemoveSetFromForm(exerciseIndex, setIndex);
        setBaselineFromValues(form.getValues());
      }
    },
    [currentEntityId, setRemoveSetModal, doRemoveSetFromForm, setBaselineFromValues, form]
  );

  const handleConfirmRemoveSet = useCallback(() => {
    const { exerciseIndex, setIndex } = removeSetModal;
    if (exerciseIndex === null || setIndex === null || !currentEntityId) return;
    const values = form.getValues();
    const exercise = values.exercises[exerciseIndex];
    if (!exercise) return;
    const newSets = exercise.sets.filter((_, i) => i !== setIndex).map((set, i) => ({ ...set, set_number: i + 1 }));
    const newExercises = values.exercises.map((ex, i) => i === exerciseIndex ? { ...ex, sets: newSets } : ex);
    const newValues: CreateWorkoutFormType = {
      name: values.name, description: values.description, exercises: newExercises,
      ...(isTemplateMode ? {} : { workout_date: values.workout_date ?? "" }),
    };
    saveToServer(values, prepareExercisesForSubmission(newExercises), () => {
      doRemoveSetFromForm(exerciseIndex, setIndex);
      setRemoveSetModal({ open: false, exerciseIndex: null, setIndex: null });
      setBaselineFromValues(newValues);
    });
  }, [removeSetModal, currentEntityId, form, isTemplateMode, saveToServer, doRemoveSetFromForm, setRemoveSetModal, setBaselineFromValues]);

  return {
    applyUnitChange,
    mapExerciseUnitToWorkoutUnit,
    handleAddExercise,
    handleRemoveExerciseClick,
    handleConfirmRemoveExercise,
    handleAddSet,
    handleCopySet,
    handleRemoveSetClick,
    handleConfirmRemoveSet,
  };
};
