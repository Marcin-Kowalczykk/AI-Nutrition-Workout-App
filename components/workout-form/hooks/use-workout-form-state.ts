"use client";

//libs
import { useState } from "react";

export type WorkoutFormRemoveExerciseModal = {
  open: boolean;
  exerciseIndex: number | null;
};

export type WorkoutFormRemoveSetModal = {
  open: boolean;
  exerciseIndex: number | null;
  setIndex: number | null;
};

interface UseWorkoutFormStateProps {
  initialWorkoutId?: string | null;
  initialTemplateId?: string | null;
  isTemplateMode: boolean;
}

export const useWorkoutFormState = ({
  initialWorkoutId,
  initialTemplateId,
  isTemplateMode,
}: UseWorkoutFormStateProps) => {
  const entityId = isTemplateMode ? initialTemplateId : initialWorkoutId;

  const [workoutId, setWorkoutId] = useState<string | null>(initialWorkoutId || null);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId || null);
  const [isFirstSave, setIsFirstSave] = useState(!entityId);
  const [isDiscardWorkoutModalOpen, setIsDiscardWorkoutModalOpen] = useState(false);
  const [removeExerciseModal, setRemoveExerciseModal] = useState<WorkoutFormRemoveExerciseModal>({
    open: false,
    exerciseIndex: null,
  });
  const [removeSetModal, setRemoveSetModal] = useState<WorkoutFormRemoveSetModal>({
    open: false,
    exerciseIndex: null,
    setIndex: null,
  });
  const [historyOpenByExerciseId, setHistoryOpenByExerciseId] = useState<Record<string, boolean>>({});
  const [headerVisible, setHeaderVisible] = useState(true);

  return {
    workoutId, setWorkoutId,
    templateId, setTemplateId,
    isFirstSave, setIsFirstSave,
    isDiscardWorkoutModalOpen, setIsDiscardWorkoutModalOpen,
    removeExerciseModal, setRemoveExerciseModal,
    removeSetModal, setRemoveSetModal,
    historyOpenByExerciseId, setHistoryOpenByExerciseId,
    headerVisible, setHeaderVisible,
  };
};
