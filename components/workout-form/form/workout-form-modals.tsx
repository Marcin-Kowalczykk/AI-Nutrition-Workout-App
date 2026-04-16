"use client";

//components
import { ConfirmModal } from "@/components/shared/confirm-modal";

//types
import type { WorkoutFormRemoveExerciseModal, WorkoutFormRemoveSetModal } from "../hooks/use-workout-form-state";

interface WorkoutFormModalsProps {
  isTemplateMode: boolean;
  currentEntityId: string | null;
  isDiscardWorkoutModalOpen: boolean;
  onDiscardOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
  isDeleting: boolean;
  isDeletingTemplate: boolean;
  removeExerciseModal: WorkoutFormRemoveExerciseModal;
  onRemoveExerciseOpenChange: (open: boolean) => void;
  onConfirmRemoveExercise: () => void;
  isUpdating: boolean;
  removeSetModal: WorkoutFormRemoveSetModal;
  onRemoveSetOpenChange: (open: boolean) => void;
  onConfirmRemoveSet: () => void;
}

export const WorkoutFormModals = ({
  isTemplateMode, currentEntityId,
  isDiscardWorkoutModalOpen, onDiscardOpenChange, onConfirmDiscard, isDeleting, isDeletingTemplate,
  removeExerciseModal, onRemoveExerciseOpenChange, onConfirmRemoveExercise, isUpdating,
  removeSetModal, onRemoveSetOpenChange, onConfirmRemoveSet,
}: WorkoutFormModalsProps) => (
  <>
    <ConfirmModal
      open={isDiscardWorkoutModalOpen}
      onOpenChange={onDiscardOpenChange}
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
      onConfirm={onConfirmDiscard}
      isPending={isTemplateMode ? isDeletingTemplate : isDeleting}
    />

    <ConfirmModal
      open={removeExerciseModal.open}
      onOpenChange={(open) => !open && onRemoveExerciseOpenChange(false)}
      title="Remove exercise?"
      description="This exercise will be removed from the workout. This action will be saved to the workout."
      confirmLabel="Remove"
      confirmVariant="destructive"
      cancelLabel="Cancel"
      onConfirm={onConfirmRemoveExercise}
      isPending={isUpdating}
    />

    <ConfirmModal
      open={removeSetModal.open}
      onOpenChange={(open) => !open && onRemoveSetOpenChange(false)}
      title="Remove set?"
      description="This set will be removed from the exercise. This action will be saved to the workout."
      confirmLabel="Remove"
      confirmVariant="destructive"
      cancelLabel="Cancel"
      onConfirm={onConfirmRemoveSet}
      isPending={isUpdating}
    />
  </>
);
