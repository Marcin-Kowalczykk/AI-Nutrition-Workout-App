"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

import { normalizeForComparison } from "@/lib/normalize-string";
import { useGetWorkoutHistory } from "@/components/workout-history/api/use-get-workout-history";
import { filterHistoryByExerciseName } from "./helpers";
import { Button } from "@/components/ui/button";
import { ExerciseHistoryWorkoutCard } from "@/components/workout-history/exercise-history-workout-card";

interface ExerciseHistoryStripProps {
  exerciseName?: string | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  layout?: "inline" | "split";
}

const CARD_MIN_WIDTH = 140;

export interface ExerciseHistoryStripContentProps {
  exerciseName?: string | null;
  isOpen?: boolean;
  maxWorkouts?: number;
}

export const ExerciseHistoryStripContent = ({
  exerciseName,
  isOpen = false,
  maxWorkouts = 5,
}: ExerciseHistoryStripContentProps) => {
  const trimmedName = exerciseName?.trim();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const { data, isLoading } = useGetWorkoutHistory({
    enabled: isOpen && !!trimmedName,
  });

  const nameNorm = trimmedName ? normalizeForComparison(trimmedName) : "";
  const history = useMemo(
    () =>
      filterHistoryByExerciseName(
        data?.workouts ?? null,
        nameNorm,
        maxWorkouts
      ),
    [nameNorm, data, maxWorkouts]
  );

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
    el.scrollBy({
      left: (el.clientWidth || CARD_MIN_WIDTH * 2) * direction,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!isOpen || !el) return;
    const handleScroll = () => updateArrows(el);
    handleScroll();
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen, history.length, updateArrows]);

  if (!trimmedName || !isOpen) return null;

  return (
    <div className="min-w-0 w-full flex flex-col gap-1">
      <div className="flex items-center justify-end min-w-0">
        {history.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              className="rounded border border-border bg-muted/50 touch-manipulation disabled:opacity-40 disabled:cursor-default"
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              className="rounded border border-border bg-muted/50 touch-manipulation disabled:opacity-40 disabled:cursor-default"
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex min-w-0 gap-1 overflow-x-auto overflow-y-hidden pb-0"
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
          history.map((workout) => (
            <ExerciseHistoryWorkoutCard
              key={workout.id}
              workout={workout}
              normalizedExerciseName={nameNorm}
              variant="compact"
            />
          ))
        )}
      </div>
    </div>
  );
};

export const ExerciseHistoryStrip = ({
  exerciseName,
  isOpen: controlledOpen,
  onOpenChange,
  layout = "inline",
}: ExerciseHistoryStripProps) => {
  const trimmedName = exerciseName?.trim();
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

  if (!trimmedName) {
    return null;
  }

  const triggerButton = (
    <Button
      type="button"
      className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline text-left mr-0 px-2"
      onClick={() => setIsOpen((prev) => !prev)}
      disabled={false}
      variant="outline"
      size="default"
    >
      <span className="flex items-center gap-0.5 font-semibold">
        <span>History</span>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </span>
    </Button>
  );

  if (layout === "split") {
    return (
      <div className="shrink-0 min-w-0 border-l-3 border-primary-element pl-2 mr-0">
        {triggerButton}
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full flex flex-col">
      <div className="flex items-center justify-between gap-2 min-w-0">
        {triggerButton}
      </div>
    </div>
  );
};
