"use client";

// libs
import { useState } from "react";
import { toast } from "sonner";

// hooks
import { useCreateWorkout } from "@/components/workout-form/api/use-create-workout";

// types
import type { IWorkoutItem } from "@/app/api/workouts/types";

type UseCopyWorkoutOptions = {
  workouts: IWorkoutItem[];
  onResetFilters: () => void;
};

type UseCopyWorkoutReturn = {
  workoutIdToCopy: string | null;
  copyingWorkoutId: string | null;
  setCopyCandidate: (id: string) => void;
  cancelCopy: () => void;
  confirmCopy: () => void;
};

export const useCopyWorkout = ({
  workouts,
  onResetFilters,
}: UseCopyWorkoutOptions): UseCopyWorkoutReturn => {
  const [workoutIdToCopy, setWorkoutIdToCopy] = useState<string | null>(null);
  const [copyingWorkoutId, setCopyingWorkoutId] = useState<string | null>(null);

  const { mutate: createWorkout } = useCreateWorkout({
    onSuccess: () => {
      setCopyingWorkoutId(null);
      onResetFilters();
      toast.success("Workout copied");
    },
    onError: (err) => {
      setCopyingWorkoutId(null);
      toast.error(err || "Failed to copy workout");
    },
  });

  const setCopyCandidate = (id: string) => setWorkoutIdToCopy(id);

  const cancelCopy = () => setWorkoutIdToCopy(null);

  const confirmCopy = () => {
    if (!workoutIdToCopy) return;
    const source = workouts.find((w) => w.id === workoutIdToCopy);
    if (!source) return;

    setCopyingWorkoutId(workoutIdToCopy);
    setWorkoutIdToCopy(null);

    createWorkout({
      name: source.name,
      description: source.description,
      exercises: source.exercises?.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({ ...set, isChecked: false })),
      })),
      created_at: new Date().toISOString(),
    });
  };

  return {
    workoutIdToCopy,
    copyingWorkoutId,
    setCopyCandidate,
    cancelCopy,
    confirmCopy,
  };
};
