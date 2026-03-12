"use client";

import { useMemo, useState } from "react";

import type { IWorkoutItem } from "@/app/api/workouts/types";

export const useWorkoutHistorySearch = (workouts: IWorkoutItem[]) => {
  const [search, setSearch] = useState("");

  const { filteredWorkouts, hasAnyWorkouts } = useMemo(() => {
    const all = workouts ?? [];
    const searchLower = search.trim().toLowerCase();

    if (!searchLower) {
      return {
        filteredWorkouts: all,
        hasAnyWorkouts: all.length > 0,
      };
    }

    const filtered = all.filter((workout: IWorkoutItem) => {
      const name = workout.name?.toLowerCase() ?? "";
      const description = workout.description?.toLowerCase() ?? "";
      return name.includes(searchLower) || description.includes(searchLower);
    });

    return {
      filteredWorkouts: filtered,
      hasAnyWorkouts: all.length > 0,
    };
  }, [workouts, search]);

  return {
    search,
    setSearch,
    filteredWorkouts,
    hasAnyWorkouts,
  };
};

