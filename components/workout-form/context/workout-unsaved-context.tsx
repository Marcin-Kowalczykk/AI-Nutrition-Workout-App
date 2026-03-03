"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type WorkoutUnsavedContextValue = {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
};

const WorkoutUnsavedContext = createContext<WorkoutUnsavedContextValue | null>(
  null
);

export const WorkoutUnsavedProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [hasUnsavedChanges, setHasUnsavedChangesState] = useState(false);

  const setHasUnsavedChanges = useCallback((value: boolean) => {
    setHasUnsavedChangesState(value);
  }, []);

  return (
    <WorkoutUnsavedContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
      }}
    >
      {children}
    </WorkoutUnsavedContext.Provider>
  );
};

export const useWorkoutUnsavedChanges = () => {
  const ctx = useContext(WorkoutUnsavedContext);
  if (!ctx) {
    throw new Error(
      "useWorkoutUnsavedChanges must be used within WorkoutUnsavedProvider"
    );
  }
  return ctx;
};
