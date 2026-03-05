"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";
import type { ExerciseUnitType } from "@/app/api/exercises/types";
import { ExerciseUnitTypeButtons } from "./exercise-unit-type-buttons";

interface AddExerciseFormProps {
  categoryId: string;
  name: string;
  unitType: ExerciseUnitType | "";
  onNameChange: (categoryId: string, value: string) => void;
  onUnitTypeChange: (categoryId: string, value: ExerciseUnitType | "") => void;
  onAdd: (categoryId: string) => void;
  isPending: boolean;
}

export const AddExerciseForm = ({
  categoryId,
  name,
  unitType,
  onNameChange,
  onUnitTypeChange,
  onAdd,
  isPending,
}: AddExerciseFormProps) => (
  <div
    className="flex flex-col gap-2 pt-2 w-full"
    onClick={(e) => e.stopPropagation()}
  >
    <Input
      placeholder="New exercise in this category"
      value={name}
      onChange={(e) => onNameChange(categoryId, e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onAdd(categoryId)}
      disabled={isPending}
      className="w-full h-9"
    />
    <div className="flex items-center gap-2 w-full flex-wrap">
      <ExerciseUnitTypeButtons
        value={unitType}
        onChange={(value) => onUnitTypeChange(categoryId, value)}
        disabled={isPending}
        className="flex-1 min-w-0"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-9 shrink-0"
        onClick={() => onAdd(categoryId)}
        disabled={!name.trim() || !unitType || isPending}
      >
        {isPending ? (
          <Loader size={16} />
        ) : (
          <>
            <Plus className="h-3 w-3" />
            <span className="capitalize">add exercise</span>
          </>
        )}
      </Button>
    </div>
  </div>
);
