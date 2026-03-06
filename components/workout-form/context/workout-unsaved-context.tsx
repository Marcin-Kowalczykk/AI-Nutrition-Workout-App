"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type WorkoutUnsavedContextValue = {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  /** Ref so the form can register a callback to run when user chooses "Leave without saving" (e.g. clear draft cache). */
  discardRef: React.MutableRefObject<(() => void) | null>;
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
  const discardRef = useRef<(() => void) | null>(null);

  const setHasUnsavedChanges = useCallback((value: boolean) => {
    setHasUnsavedChangesState(value);
  }, []);

  return (
    <WorkoutUnsavedContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        discardRef,
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
