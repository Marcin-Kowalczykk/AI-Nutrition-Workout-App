"use client";

//hooks
import type { UseFormReturn } from "react-hook-form";
import type { UseRpeStateReturn } from "./rpe/use-rpe-state";

//components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";
import { Plus, Trash2 } from "lucide-react";
import { ExercisesSelect } from "@/components/shared/exercises-select";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ExerciseHistoryStrip, ExerciseHistoryStripContent } from "./exercise-history-strip/exercise-history-strip";
import { SetRow } from "./set-row";

//types
import type { CreateWorkoutFormType } from "../types";
import { WORKOUT_UNIT_TYPE, type WorkoutUnitType } from "../types";
import type { ExerciseUnitType } from "@/app/api/exercises/types";

interface ExerciseRowProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  exercise: CreateWorkoutFormType["exercises"][number] & { id: string };
  exerciseIndex: number;
  isTemplateMode: boolean;
  isPending: boolean;
  historyOpenByExerciseId: Record<string, boolean>;
  onHistoryChange: (exerciseId: string, open: boolean) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  rpeState: UseRpeStateReturn;
  onSubmit: () => void;
  submitLabel: string;
  hasExerciseChanges: (exerciseIndex: number) => boolean;
  isLastExercise: boolean;
  applyUnitChange: (exerciseIndex: number, newUnit: WorkoutUnitType) => void;
  mapExerciseUnitToWorkoutUnit: (unitType: ExerciseUnitType | undefined) => WorkoutUnitType;
}

export const ExerciseRow = ({
  form, exercise, exerciseIndex, isTemplateMode, isPending,
  historyOpenByExerciseId, onHistoryChange, onAddSet, onRemoveExercise, onRemoveSet,
  rpeState, onSubmit, submitLabel, hasExerciseChanges, isLastExercise,
  applyUnitChange, mapExerciseUnitToWorkoutUnit,
}: ExerciseRowProps) => {
  const exerciseName = (form.watch(`exercises.${exerciseIndex}.name`) ?? "") || undefined;
  const unitType =
    (form.watch(`exercises.${exerciseIndex}.unitType`) as WorkoutUnitType | undefined) ??
    WORKOUT_UNIT_TYPE.REPS_BASED;
  const sets = form.watch(`exercises.${exerciseIndex}.sets`) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start space-y-0 p-2">
        <CardTitle className="flex w-full flex-wrap items-stretch gap-x-1 gap-y-2 min-w-0">
          <div className="flex shrink-0 items-center">
            <ExerciseHistoryStrip
              layout="split"
              exerciseName={exerciseName}
              isOpen={historyOpenByExerciseId[exercise.id] === true}
              onOpenChange={(open) => onHistoryChange(exercise.id, open)}
            />
          </div>
          <div className="flex flex-1 min-w-0 items-center">
            <FormField
              control={form.control}
              name={`exercises.${exerciseIndex}.name`}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl className="w-full">
                    <ExercisesSelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                      onExerciseSelectedMeta={(meta) => {
                        applyUnitChange(exerciseIndex, mapExerciseUnitToWorkoutUnit(meta.unitType));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex shrink-0 items-center">
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveExercise(exerciseIndex)} disabled={isPending} className="shrink-0 size-4 min-w-0 p-0.5 text-destructive hover:text-destructive" aria-label="Remove exercise">
              <Trash2 />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex min-w-0 flex-col gap-0.5 px-2 py-0">
        <ExerciseHistoryStripContent exerciseName={exerciseName} isOpen={historyOpenByExerciseId[exercise.id] === true} />

        <div className="flex flex-col gap-1.5">
          {sets.map((set, setIndex) => (
            <SetRow
              key={set.id}
              form={form}
              exerciseIndex={exerciseIndex}
              setIndex={setIndex}
              set={set}
              isTemplateMode={isTemplateMode}
              isPending={isPending}
              unitType={unitType}
              rpeState={rpeState}
              onRemoveSet={onRemoveSet}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-1 py-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={() => onAddSet(exerciseIndex)} disabled={isPending || !exerciseName?.trim()} className="gap-2 shrink-0 w-[5.75rem]">
            <Plus className="h-4 w-4" />Add Set
          </Button>
          <div className="flex items-center gap-1">
            {!isTemplateMode && <div className="w-[3.5rem] shrink-0" />}
            <div className="size-4 shrink-0" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onRemoveExercise(exerciseIndex)} disabled={isPending} className="gap-2 min-w-0 text-muted-foreground hover:text-primary w-[10rem]">
            <Trash2 className="h-4 w-4 text-destructive" />Remove Exercise
          </Button>
        </div>

        {!isLastExercise && hasExerciseChanges(exerciseIndex) && (
          <Button type="button" variant="default" disabled={isPending} onClick={onSubmit} className="mt-2 w-full">
            {isPending ? <Loader /> : submitLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
