"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { normalizeForComparison } from "@/lib/normalize-string";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORKOUT_UNIT_TYPE } from "../../../types";
import {
  filterHistoryByExerciseName,
  formatWorkoutDate,
  getUnitColumn,
  isSetChecked as isHistorySetChecked,
} from "./helpers";
import { Button } from "@/components/ui/button";

interface ExerciseHistoryStripProps {
  exerciseName?: string | null;
  maxWorkouts?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CARD_MIN_WIDTH = 140;

export const ExerciseHistoryStrip = ({
  exerciseName,
  maxWorkouts = 5,
  isOpen: controlledOpen,
  onOpenChange,
}: ExerciseHistoryStripProps) => {
  const trimmedName = exerciseName?.trim();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(isOpen) : value;
      if (isControlled) onOpenChange?.(next);
      else setInternalOpen(next);
    },
    [isControlled, isOpen, onOpenChange]
  );
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const { data, isLoading } = useGetWorkoutHistory({
    enabled: isOpen,
  });

  const nameNorm = trimmedName ? normalizeForComparison(trimmedName) : "";

  const history = useMemo(() => {
    return filterHistoryByExerciseName(
      data?.workouts ?? null,
      nameNorm,
      maxWorkouts
    );
  }, [nameNorm, data, maxWorkouts]);

  const updateArrows = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) {
        setCanPrev(false);
        setCanNext(false);
        return;
      }
      const { scrollLeft, clientWidth, scrollWidth } = el;
      const tolerance = 2;
      setCanPrev(scrollLeft > tolerance);
      setCanNext(scrollLeft + clientWidth < scrollWidth - tolerance);
    },
    [setCanPrev, setCanNext]
  );

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const viewportWidth = el.clientWidth || CARD_MIN_WIDTH * 2;
    const step = viewportWidth;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

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

  return (
    <div className="min-w-0 w-full flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Button
          type="button"
          className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline text-left"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isLoading}
          variant="showHide"
          size="showHide"
        >
          <span className="flex items-center gap-1">
            <span>History</span>
            {isOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </span>
        </Button>
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
          className="flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden pb-1"
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
                (exercise) =>
                  normalizeForComparison(exercise.name ?? "") === nameNorm
              );

              if (!exercises.length) return null;

              const unitColumn = getUnitColumn(exercises);

              return (
                <div
                  key={workout.id}
                  className="shrink-0 w-[calc(50%-0.25rem)] min-w-[140px] max-w-[220px] rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px] leading-snug overflow-hidden"
                >
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5 min-w-0">
                    <span className="text-[9px] text-muted-foreground wrap-break-word">
                      {formatWorkoutDate(workout.created_at)}
                    </span>
                    <span className="text-[10px] font-medium text-right wrap-break-word">
                      {workout.name}
                    </span>
                  </div>
                  <Table className="text-[10px] [&_th]:h-6 [&_th]:px-1 [&_td]:px-1 [&_td]:py-0.5 [&_tr]:border-border">
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={
                            unitColumn
                              ? "w-[30%] text-[9px]"
                              : "w-[40%] text-[9px]"
                          }
                        >
                          Set
                        </TableHead>
                        <TableHead
                          className={
                            unitColumn
                              ? "w-[25%] text-[9px] text-right"
                              : "w-[60%] text-[9px] text-right"
                          }
                        >
                          Reps
                        </TableHead>
                        {unitColumn !== null && (
                          <TableHead className="w-[45%] text-[9px] text-right first-letter:uppercase">
                            {unitColumn}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exercises.map((exercise) =>
                        exercise.sets.map((set) => {
                          const isSetChecked = isHistorySetChecked(
                            set as {
                              isChecked?: boolean;
                              is_checked?: boolean;
                            }
                          );
                          return (
                            <TableRow key={set.id}>
                              <TableCell>
                                <span
                                  className={`mr-1 ${
                                    isSetChecked
                                      ? "text-green-700"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {isSetChecked ? "✔" : "✕"}
                                </span>
                                <span className="text-muted-foreground">
                                  {set.set_number}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {set.reps}
                              </TableCell>
                              {unitColumn !== null && (
                                <TableCell className="text-right">
                                  {unitColumn === WORKOUT_UNIT_TYPE.WEIGHT
                                    ? set.weight !== undefined &&
                                      set.weight !== null
                                      ? `${set.weight} kg`
                                      : "-"
                                    : set.duration !== undefined &&
                                      set.duration !== null &&
                                      set.duration > 0
                                    ? `${set.duration} s`
                                    : "-"}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
