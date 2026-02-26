"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { Loader } from "@/components/shared/loader";
import { useListCategories } from "@/components/exercises/api/use-list-categories";
import { useListExercises } from "@/components/exercises/api/use-list-exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ExercisesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ExercisesSearchInput = ({
  value,
  onChange,
}: ExercisesSearchInputProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search exercises..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-8"
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
};

interface ExercisesSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ExercisesSelect = ({
  value,
  onChange,
  disabled,
}: ExercisesSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    new Set()
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSearchQuery("");
    setOpen(nextOpen);
  };

  const { data: categoriesData, isLoading: loadingCategories } =
    useListCategories();
  const { data: exercisesData, isLoading: loadingExercises } =
    useListExercises();

  const categories = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData?.categories]
  );
  const exercises = useMemo(
    () => exercisesData?.exercises ?? [],
    [exercisesData?.exercises]
  );

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; exercises: { id: string; name: string }[] }
    >();

    for (const category of categories) {
      map.set(category.id, {
        id: category.id,
        name: category.name,
        exercises: [],
      });
    }

    for (const exercise of exercises) {
      const category = map.get(exercise.category_id);
      if (!category) continue;
      category.exercises.push({ id: exercise.id, name: exercise.name });
    }

    const OTHER_NAME = "other";
    const list = Array.from(map.values()).map((group) => ({
      ...group,
      exercises: [...group.exercises].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));

    list.sort((a, b) => {
      const aIsOther = a.name.toLowerCase() === OTHER_NAME;
      const bIsOther = b.name.toLowerCase() === OTHER_NAME;
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [categories, exercises]);

  const searchLower = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!searchLower) return groups;
    return groups
      .map((group) => ({
        ...group,
        exercises: group.exercises.filter((ex) =>
          ex.name.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((g) => g.exercises.length > 0);
  }, [groups, searchLower]);

  const selectedExercise = useMemo(
    () =>
      value
        ? exercises.find(
            (exercise: { name: string }) => exercise.name === value
          ) ?? null
        : null,
    [exercises, value]
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleSelectExercise = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  if (loadingCategories || loadingExercises) {
    return (
      <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        <span>Loading exercises...</span>
        <Loader size={20} />
      </div>
    );
  }

  if (!categories.length || !exercises.length) {
    return (
      <div className="flex h-9 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 text-xs text-muted-foreground">
        You have no exercises yet. Add them on the Exercises page.
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between font-normal",
            !selectedExercise?.name && !value?.trim() && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selectedExercise?.name || value?.trim() || "Select exercise"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <div className="border-b border-border p-2">
          <ExercisesSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="max-h-[min(60vh,20rem)] overflow-y-auto">
          {filteredGroups.map((group) => {
            const isExpanded = searchLower
              ? true
              : expandedCategoryIds.has(group.id);
            const isEmpty = !searchLower && group.exercises.length === 0;
            return (
              <div
                key={group.id}
                className="border-b border-border last:border-b-0"
              >
                {isEmpty ? (
                  <div className="flex w-full cursor-default items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground">
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                    <span className="flex-1">{group.name}</span>
                    <span className="text-muted-foreground text-xs">0</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-1">{group.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {group.exercises.length}
                    </span>
                  </button>
                )}
                {isExpanded && (
                  <div className="bg-muted/30 pl-6 pr-1 pb-1">
                    {group.exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleSelectExercise(exercise.name)}
                        className={cn(
                          "flex w-full items-center rounded-md px-2 py-2 text-left text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                          value === exercise.name
                            ? "bg-accent text-accent-foreground font-medium"
                            : "hover:bg-accent/80 hover:text-accent-foreground"
                        )}
                      >
                        {exercise.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
