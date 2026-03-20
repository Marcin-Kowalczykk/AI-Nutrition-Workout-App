import { normalizeForComparison } from "@/lib/normalize-string";
import type {
  IWorkoutExerciseItem,
  IWorkoutItem,
} from "@/app/api/workouts/types";
import { WORKOUT_UNIT_TYPE } from "@/components/workout-form/types";
import {
  formatWorkoutDate,
  getUnitColumn,
  isSetChecked as isHistorySetChecked,
} from "@/components/workout-form/components/edit/exercise-history-strip/helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, CircleX } from "lucide-react";

type ExerciseHistoryWorkoutCardVariant = "compact" | "full";

interface ExerciseHistoryWorkoutCardProps {
  workout: IWorkoutItem;
  normalizedExerciseName: string;
  variant?: ExerciseHistoryWorkoutCardVariant;
}

export const ExerciseHistoryWorkoutCard = ({
  workout,
  normalizedExerciseName,
  variant = "compact",
}: ExerciseHistoryWorkoutCardProps) => {
  const exercises = (workout.exercises ?? []).filter(
    (ex: IWorkoutExerciseItem) =>
      normalizeForComparison(ex.name ?? "") === normalizedExerciseName
  );

  if (!exercises.length) return null;

  const unitColumn = getUnitColumn(exercises);

  const hasRpe = exercises
    .flatMap((ex) => ex.sets)
    .some((set) => set.rpe != null);

  const outerClasses =
    variant === "compact"
      ? "shrink-0 w-[calc(50%-0.25rem)] min-w-[140px] max-w-[220px] rounded-md border border-border bg-muted/30 px-1 py-1 text-[11px] leading-snug overflow-hidden"
      : "w-full rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[12px] leading-snug";

  const headerWrapperClass =
    variant === "compact"
      ? "mb-1 flex flex-nowrap items-start justify-between gap-x-2 gap-y-0.5 min-w-0"
      : "mb-1.5 flex flex-nowrap items-start justify-between gap-x-2 gap-y-0.5 min-w-0";

  const dateTextClass =
    variant === "compact"
      ? "text-[9px] text-muted-foreground whitespace-nowrap shrink-0"
      : "inline-block text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 border-primary-element pb-0.5";

  const titleTextClass =
    variant === "compact"
      ? "text-[10px] font-medium text-right truncate min-w-0"
      : "text-xs text-muted-foreground text-right truncate min-w-0";

  const tableClass =
    variant === "compact"
      ? "text-[10px] w-full table-fixed [&_th]:h-6 [&_th]:py-0.5 [&_td]:py-0.5 [&_tr]:border-border [&_th:first-child]:pl-0 [&_th:last-child]:pr-0 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th]:px-1 [&_td]:px-1"
      : "text-xs w-full table-fixed [&_th]:h-1 [&_th]:py-0.5 [&_td]:py-0.5 [&_tr]:border-border [&_th:first-child]:pl-0 [&_th:last-child]:pr-1 [&_td:first-child]:pl-0 [&_td:last-child]:pr-1 [&_th]:px-1 [&_td]:px-1";

  return (
    <div className={outerClasses}>
      <div className={headerWrapperClass}>
        <span className={dateTextClass}>
          {formatWorkoutDate(workout.created_at)}
        </span>
        <span className={titleTextClass} title={workout.name}>
          {workout.name}
        </span>
      </div>
      <Table className={tableClass}>
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                unitColumn
                  ? `${hasRpe ? "w-[22%]" : "w-[30%]"} text-[9px] text-center pl-0`
                  : `${hasRpe ? "w-[28%]" : "w-[40%]"} text-[9px] text-center pl-0`
              }
            >
              Set
            </TableHead>
            <TableHead
              className={
                unitColumn
                  ? `${hasRpe ? "w-[22%]" : "w-[25%]"} text-[9px] text-center`
                  : `${hasRpe ? "w-[28%]" : "w-[60%]"} text-[9px] text-center pr-0`
              }
            >
              {unitColumn === WORKOUT_UNIT_TYPE.DURATION ? "Duration" : "Reps"}
            </TableHead>
            {unitColumn !== null && (
              <TableHead className={`${hasRpe ? "w-[33%]" : "w-[45%]"} text-[9px] text-center pr-0`}>
                Weight
              </TableHead>
            )}
            {hasRpe && (
              <TableHead className="w-[23%] text-[9px] text-center pr-0">
                RPE
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((ex) =>
            ex.sets.map((set) => {
              const isSetChecked = isHistorySetChecked(
                set as {
                  isChecked?: boolean;
                  is_checked?: boolean;
                }
              );
              return (
                <TableRow key={set.id}>
                  <TableCell className="flex justify-center pl-0">
                    <span className="inline-flex items-center gap-1">
                      {isSetChecked ? (
                        <CheckCircle
                          className="text-success shrink-0"
                          size={12}
                          aria-hidden
                        />
                      ) : (
                        <CircleX
                          className="text-destructive shrink-0"
                          size={12}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      )}
                      <span className="text-muted-foreground">
                        {set.set_number}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {unitColumn === WORKOUT_UNIT_TYPE.DURATION
                      ? typeof set.duration === "number"
                        ? `${set.duration} s`
                        : "-"
                      : set.reps}
                  </TableCell>
                  {unitColumn !== null && (
                    <TableCell className="text-center pr-0">
                      {typeof set.weight === "number" && set.weight > 0
                        ? `${set.weight} kg`
                        : "-"}
                    </TableCell>
                  )}
                  {hasRpe && (
                    <TableCell className="text-center pr-0">
                      {set.rpe != null ? set.rpe : "-"}
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
};
