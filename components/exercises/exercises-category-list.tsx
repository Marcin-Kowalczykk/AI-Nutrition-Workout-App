"use client";

import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  IExercise,
  IExerciseCategory,
  ExerciseUnitType,
} from "@/app/api/exercises/types";
import { ExerciseListItem } from "./exercise-list-item";
import { AddExerciseForm } from "./add-exercise-form";

export interface CategoryWithExercises {
  category: IExerciseCategory;
  exercises: IExercise[];
}

interface ExercisesCategoryListProps {
  categories: CategoryWithExercises[];
  hasAnyCategories: boolean;
  expandedIds: Set<string>;
  multiDeleteMode: boolean;
  selectedCategoryIds: Set<string>;
  selectedExerciseIds: Set<string>;
  searchLower: string;
  newExerciseByCategory: Record<string, string>;
  newExerciseUnitByCategory: Record<string, ExerciseUnitType | "">;
  isCreatingExercise: boolean;
  onToggleExpanded: (id: string) => void;
  onToggleCategorySelection: (id: string) => void;
  onToggleExerciseSelection: (id: string) => void;
  onOpenDeleteCategory: (categoryId: string) => void;
  onOpenDeleteExercise: (exerciseId: string) => void;
  onAddExercise: (categoryId: string) => void;
  onNewExerciseNameChange: (categoryId: string, value: string) => void;
  onNewExerciseUnitChange: (categoryId: string, value: ExerciseUnitType | "") => void;
}

export const ExercisesCategoryList = ({
  categories,
  hasAnyCategories,
  expandedIds,
  multiDeleteMode,
  selectedCategoryIds,
  selectedExerciseIds,
  searchLower,
  newExerciseByCategory,
  newExerciseUnitByCategory,
  isCreatingExercise,
  onToggleExpanded,
  onToggleCategorySelection,
  onToggleExerciseSelection,
  onOpenDeleteCategory,
  onOpenDeleteExercise,
  onAddExercise,
  onNewExerciseNameChange,
  onNewExerciseUnitChange,
}: ExercisesCategoryListProps) => {
  if (categories.length === 0) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        {hasAnyCategories
          ? "No categories or exercises match your search."
          : "Add a category above or add an exercise using the input above (it will go to the default category)."}
      </div>
    );
  }

  return (
    <>
      {categories.map(({ category, exercises: catExercises }) => {
        const isExpanded = expandedIds.has(category.id);
        const isCategorySelected = selectedCategoryIds.has(category.id);

        return (
          <div key={category.id} className="flex flex-col">
            <div
              data-testid="exercise-category-item"
              className="flex items-center gap-2 p-3 hover:bg-muted/50 cursor-pointer min-h-12"
              onClick={() => onToggleExpanded(category.id)}
            >
              {multiDeleteMode && (
                <Checkbox
                  checked={isCategorySelected}
                  onCheckedChange={() => onToggleCategorySelection(category.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium flex-1 capitalize">
                {category.name}
              </span>
              {catExercises.length > 0 && (
                <span className="text-muted-foreground text-sm">
                  {catExercises.length}
                </span>
              )}
              {category.name.toLowerCase() !== "other" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeleteCategory(category.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isExpanded && (
              <div className="pl-4 pr-3 pb-3 pt-0 space-y-2 bg-muted/20">
                {catExercises.map((ex) => (
                  <ExerciseListItem
                    key={ex.id}
                    exercise={ex}
                    multiDeleteMode={multiDeleteMode}
                    isSelected={selectedExerciseIds.has(ex.id)}
                    isSearchMatch={
                      !!searchLower && ex.name?.toLowerCase().includes(searchLower)
                    }
                    onToggleSelection={onToggleExerciseSelection}
                    onDelete={onOpenDeleteExercise}
                  />
                ))}
                <AddExerciseForm
                  categoryId={category.id}
                  name={newExerciseByCategory[category.id] ?? ""}
                  unitType={newExerciseUnitByCategory[category.id] ?? ""}
                  onNameChange={onNewExerciseNameChange}
                  onUnitTypeChange={onNewExerciseUnitChange}
                  onAdd={onAddExercise}
                  isPending={isCreatingExercise}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
