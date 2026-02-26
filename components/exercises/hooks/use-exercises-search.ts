import { useEffect, useMemo, useRef, useState } from "react";

import type {
  IExercise,
  IExerciseCategory,
} from "@/app/api/exercises/types";

interface UseExercisesSearchParams {
  categories: IExerciseCategory[];
  exercisesByCategory: Record<string, IExercise[]>;
}

export const useExercisesSearch = ({
  categories,
  exercisesByCategory,
}: UseExercisesSearchParams) => {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const searchLower = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    const OTHER_NAME = "other";
    let list: { category: IExerciseCategory; exercises: IExercise[] }[];
    if (!searchLower) {
      list = categories.map((c: IExerciseCategory) => ({
        category: c,
        exercises: exercisesByCategory[c.id] ?? [],
      }));
    } else {
      list = categories
        .map((c: IExerciseCategory) => ({
          category: c,
          exercises: (exercisesByCategory[c.id] ?? []).filter(
            (e) =>
              e.name.toLowerCase().includes(searchLower) ||
              c.name.toLowerCase().includes(searchLower)
          ),
        }))
        .filter(
          (item: { category: IExerciseCategory; exercises: IExercise[] }) =>
            item.category.name.toLowerCase().includes(searchLower) ||
            item.exercises.length > 0
        );
    }
    return [...list].sort((a, b) => {
      const aIsOther = a.category.name.toLowerCase() === OTHER_NAME;
      const bIsOther = b.category.name.toLowerCase() === OTHER_NAME;
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return 0;
    });
  }, [categories, exercisesByCategory, searchLower]);

  const isOnlyOtherCategory =
    categories.length === 1 && categories[0].name.toLowerCase() === "other";

  const prevFilterRef = useRef({ searchLower: "", isOnlyOther: false });

  useEffect(() => {
    const prev = prevFilterRef.current;
    const filterChanged =
      prev.searchLower !== searchLower ||
      prev.isOnlyOther !== isOnlyOtherCategory;
    prevFilterRef.current = { searchLower, isOnlyOther: isOnlyOtherCategory };

    if (!filterChanged) return;

    const nextExpanded = new Set<string>();

    if (searchLower) {
      categories.forEach((category: IExerciseCategory) => {
        const catNameMatches = category.name
          .toLowerCase()
          .includes(searchLower);
        const catExercises = exercisesByCategory[category.id] ?? [];
        const hasMatchingExercise = catExercises.some((ex) =>
          ex.name.toLowerCase().includes(searchLower)
        );

        if (catNameMatches || hasMatchingExercise) {
          nextExpanded.add(category.id);
        }
      });
    } else if (isOnlyOtherCategory) {
      nextExpanded.add(categories[0].id);
    }

    queueMicrotask(() => {
      setExpandedIds((prev) => {
        if (prev.size === nextExpanded.size) {
          let same = true;
          for (const id of prev) {
            if (!nextExpanded.has(id)) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return nextExpanded;
      });
    });
  }, [searchLower, categories, exercisesByCategory, isOnlyOtherCategory]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    search,
    setSearch,
    searchLower,
    filteredCategories,
    expandedIds,
    toggleExpanded,
  };
};

