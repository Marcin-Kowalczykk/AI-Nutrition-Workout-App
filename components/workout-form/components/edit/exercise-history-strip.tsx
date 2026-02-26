"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import type { IWorkoutExerciseItem } from "@/app/api/workouts/types";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";

interface ExerciseHistoryStripProps {
  exerciseName?: string | null;
  maxWorkouts?: number;
}

const CARD_MIN_WIDTH = 140;

export const ExerciseHistoryStrip = ({
  exerciseName,
  maxWorkouts = 5,
}: ExerciseHistoryStripProps) => {
  const trimmedName = exerciseName?.trim();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
   const [canPrev, setCanPrev] = useState(false);
   const [canNext, setCanNext] = useState(false);

  const { data, isLoading } = useGetWorkoutHistory({
    enabled: isOpen,
  });

  const history = useMemo(() => {
    if (!trimmedName || !data?.workouts) return [];

    const withExercise = data.workouts.filter((workout) =>
      (workout.exercises ?? []).some(
        (exercise: IWorkoutExerciseItem) => exercise.name === trimmedName,
      ),
    );

    return withExercise.slice(0, maxWorkouts);
  }, [trimmedName, data, maxWorkouts]);

  const updateArrows = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const tolerance = 2;
    setCanPrev(scrollLeft > tolerance);
    setCanNext(scrollLeft + clientWidth < scrollWidth - tolerance);
  }, []);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const el = scrollRef.current;
      if (!el) return;
      const viewportWidth = el.clientWidth || CARD_MIN_WIDTH * 2;
      const step = viewportWidth;
      el.scrollBy({ left: step * direction, behavior: "smooth" });
    },
    [],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!isOpen || !el) {
      return;
    }

    const handleScroll = () => updateArrows(el);
    handleScroll();
    el.addEventListener("scroll", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, history.length, updateArrows]);

  if (!trimmedName) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // pełna data, np. "26 lutego 2026"
    return format(date, "d MMMM yyyy", { locale: pl });
  };

  return (
    <div className="min-w-0 w-full flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <button
          type="button"
          className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline text-left"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isLoading}
        >
          {isOpen ? "Hide history" : "Show history"}
        </button>
        {isOpen && history.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              className="rounded border border-border bg-muted/50 px-1.5 py-0.5 touch-manipulation disabled:opacity-40 disabled:cursor-default"
              aria-label="Previous"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              className="rounded border border-border bg-muted/50 px-1.5 py-0.5 touch-manipulation disabled:opacity-40 disabled:cursor-default"
              aria-label="Next"
            >
              ▶
            </button>
          </div>
        )}
      </div>
      {isOpen && (
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {isLoading && history.length === 0 ? (
            <div className="flex h-6 items-center text-[10px] text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="flex h-6 items-center text-[10px] text-muted-foreground">
              No previous workouts with this exercise yet.
            </div>
          ) : (
            history.map((workout) => {
          const exercises = (workout.exercises ?? []).filter(
            (exercise) => exercise.name === trimmedName,
          );

          if (!exercises.length) return null;

              return (
                <div
                  key={workout.id}
                  className="shrink-0 w-[calc(50%-0.25rem)] min-w-[140px] max-w-[220px] rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px] leading-snug overflow-hidden"
                >
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5 min-w-0">
                    <span className="text-[9px] text-muted-foreground wrap-break-word">
                      {formatDate(workout.created_at)}
                    </span>
                    <span className="text-[10px] font-medium text-right wrap-break-word">
                      {workout.name}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {exercises.map((exercise) =>
                      exercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between gap-1"
                        >
                          <span
                            className={`text-[10px] ${
                              set.isChecked
                                ? "text-success"
                                : "text-muted-foreground"
                            }`}
                          >
                            {set.isChecked ? "✔" : "✕"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            S{set.set_number}
                          </span>
                          <span className="ml-1 flex-1 truncate text-right">
                            {set.reps} reps
                            {set.weight !== undefined && set.weight !== null && (
                              <span>, {set.weight} kg</span>
                            )}
                            {set.duration !== undefined &&
                              set.duration !== null &&
                              set.duration > 0 && (
                                <span>, {set.duration}s</span>
                              )}
                          </span>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

