"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Loader } from "@/components/shared/loader";
import { normalizeForComparison } from "@/lib/normalize-string";
import { useListCategories } from "@/components/exercises/api/use-list-categories";
import { useListExercises } from "@/components/exercises/api/use-list-exercises";
import { ExerciseUnitType } from "@/app/api/exercises/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";

interface ExercisesSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  onExerciseSelectedMeta?: (meta: {
    id: string;
    name: string;
    unitType?: ExerciseUnitType;
  }) => void;
  portalContainer?: HTMLElement | null;
}

export const ExercisesSelect = ({
  value,
  onChange,
  disabled,
  onExerciseSelectedMeta,
  portalContainer,
}: ExercisesSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    new Set()
  );
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchQuery("");
    }
    setOpen(nextOpen);
  };

  useEffect(() => {
    if (open && popoverContentRef.current) {
      requestAnimationFrame(() => {
        popoverContentRef.current?.scrollIntoView({
          block: "end",
          behavior: "smooth",
        });
      });
    }
  }, [open]);

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
    const searchNorm = normalizeForComparison(searchQuery);
    return groups
      .map((group) => ({
        ...group,
        exercises: group.exercises.filter((ex) =>
          normalizeForComparison(ex.name).includes(searchNorm)
        ),
      }))
      .filter((g) => g.exercises.length > 0);
  }, [groups, searchLower, searchQuery]);

  const selectedExercise = useMemo(
    () =>
      value
        ? exercises.find(
            (exercise: { name: string }) =>
              normalizeForComparison(exercise.name) ===
              normalizeForComparison(value)
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

    if (onExerciseSelectedMeta) {
      const selected =
        exercises.find(
          (exercise: { name: string }) =>
            normalizeForComparison(exercise.name) ===
            normalizeForComparison(name)
        ) ?? null;

      if (selected) {
        onExerciseSelectedMeta({
          id: selected.id,
          name: selected.name,
          unitType: (selected as { unit_type?: ExerciseUnitType }).unit_type,
        });
      }
    }

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
            "h-9 w-full min-w-0 justify-between font-normal",
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
        ref={popoverContentRef}
        container={portalContainer ?? undefined}
        className="w-(--radix-popover-trigger-width) p-0 max-h-[min(85vh,28rem)] flex flex-col overflow-hidden"
        align="start"
        side="bottom"
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border p-2 shrink-0">
          <SearchInput
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[min(60vh,20rem)]">
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
                          normalizeForComparison(value ?? "") ===
                            normalizeForComparison(exercise.name)
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
