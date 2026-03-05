"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import type { IExercise } from "@/app/api/exercises/types";
import { ExerciseUnitBadge } from "./exercise-unit-badge";

interface ExerciseListItemProps {
  exercise: IExercise;
  multiDeleteMode: boolean;
  isSelected: boolean;
  isSearchMatch: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ExerciseListItem = ({
  exercise,
  multiDeleteMode,
  isSelected,
  isSearchMatch,
  onToggleSelection,
  onDelete,
}: ExerciseListItemProps) => (
  <div
    className={`flex items-center gap-2 py-1.5 pl-2 rounded hover:bg-muted/50 ${
      isSearchMatch ? "border-b bg-muted/50 rounded-lg" : ""
    }`}
    onClick={(e) => e.stopPropagation()}
  >
    {multiDeleteMode && (
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelection(exercise.id)}
      />
    )}
    <span className="min-w-0 flex-1 truncate capitalize">
      {exercise.name}
    </span>
    <ExerciseUnitBadge unitType={exercise.unit_type} />
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-destructive hover:text-destructive/80"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(exercise.id);
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);
