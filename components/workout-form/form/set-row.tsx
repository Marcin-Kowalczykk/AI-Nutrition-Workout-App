"use client";

//libs
import { cn } from "@/lib/utils";

//hooks
import type { UseFormReturn } from "react-hook-form";
import type { UseRpeStateReturn } from "./rpe/use-rpe-state";

//components
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { NativeCheckbox } from "@/components/shared/native-checkbox";
import { RpeToggleButton, RpeSliderPanel } from "./rpe";

//types
import type { CreateWorkoutFormType } from "../types";
import { WORKOUT_UNIT_TYPE, type WorkoutUnitType } from "../types";

interface SetRowProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  exerciseIndex: number;
  setIndex: number;
  set: CreateWorkoutFormType["exercises"][number]["sets"][number];
  isTemplateMode: boolean;
  isPending: boolean;
  unitType: WorkoutUnitType;
  rpeState: UseRpeStateReturn;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
}

export const SetRow = ({
  form, exerciseIndex, setIndex, set, isTemplateMode, isPending, unitType, rpeState, onRemoveSet,
}: SetRowProps) => {
  const rpeKey = `${exerciseIndex}-${setIndex}`;
  const { rpeOpenBySet, rpeSliderDisplayBySet, toggleRpePanel, clearRpeDisplay, setRpeDisplay } = rpeState;

  const rpeValue = form.watch(
    `exercises.${exerciseIndex}.sets.${setIndex}.rpe` as `exercises.${number}.sets.${number}.rpe`
  ) as number | null | undefined;
  const rpeDisplayValue = rpeSliderDisplayBySet[rpeKey] ?? rpeValue ?? 5;
  const isChecked = (form.watch(
    `exercises.${exerciseIndex}.sets.${setIndex}.isChecked` as `exercises.${number}.sets.${number}.isChecked`
  ) as boolean | undefined) ?? false;

  const setErrors = form.formState.errors?.exercises?.[exerciseIndex]?.sets?.[setIndex];
  const setErrorMsg = setErrors?.reps?.message ?? setErrors?.weight?.message ?? setErrors?.duration?.message;

  return (
    <div className="flex flex-col min-w-0">
      <div className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5",
        !isTemplateMode && isChecked ? "border-success/[0.27] bg-success/[0.06]" : "border-border bg-muted"
      )}>
        {!isTemplateMode && (
          <FormField
            control={form.control}
            name={`exercises.${exerciseIndex}.sets.${setIndex}.isChecked`}
            render={({ field }) => (
              <FormItem className="shrink-0 mt-4">
                <FormControl>
                  <NativeCheckbox checked={field.value ?? false} onChange={field.onChange} disabled={isPending} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className={cn(
          "mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black",
          !isTemplateMode && isChecked ? "border-success/40 bg-success/10 text-success" : "border-border bg-accent text-muted-foreground"
        )}>
          {set.set_number || setIndex + 1}
        </div>

        {unitType === WORKOUT_UNIT_TYPE.DURATION ? (
          <>
            <FormField control={form.control} name={`exercises.${exerciseIndex}.sets.${setIndex}.duration`}
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0 space-y-1">
                  <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">Duration s</FormLabel>
                  <FormControl><Input type="number" step={1} min={0} autoComplete="off" disabled={isPending} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} className="text-center font-bold" /></FormControl>
                </FormItem>
              )}
            />
            <FormField control={form.control} name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0 space-y-1">
                  <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">Weight kg</FormLabel>
                  <FormControl><Input type="number" step={0.1} min={0} autoComplete="off" disabled={isPending} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} className="text-center font-bold" /></FormControl>
                </FormItem>
              )}
            />
          </>
        ) : (
          <>
            <FormField control={form.control} name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0 space-y-1">
                  <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">Reps</FormLabel>
                  <FormControl><Input type="number" step={1} min={0} autoComplete="off" disabled={isPending} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} className="text-center font-bold" /></FormControl>
                </FormItem>
              )}
            />
            <FormField control={form.control} name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0 space-y-1">
                  <FormLabel className="block text-center text-[8px] uppercase tracking-widest text-muted-foreground">Weight kg</FormLabel>
                  <FormControl><Input type="number" step={0.1} min={0} autoComplete="off" disabled={isPending} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} className="text-center font-bold" /></FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {!isTemplateMode && (
          <RpeToggleButton control={form.control} exerciseIndex={exerciseIndex} setIndex={setIndex} rpeOpenBySet={rpeOpenBySet} isPending={isPending} onToggle={toggleRpePanel} />
        )}

        <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveSet(exerciseIndex, setIndex)} disabled={isPending} className="mt-5 text-destructive size-4 hover:text-destructive shrink-0 min-w-0 p-0.5">
          <Trash2 />
        </Button>
      </div>

      {!isTemplateMode && rpeOpenBySet[rpeKey] && (
        <RpeSliderPanel
          rpeValue={rpeValue}
          displayValue={rpeDisplayValue}
          isPending={isPending}
          onValueChange={(val) => {
            setRpeDisplay(rpeKey, val);
            form.setValue(`exercises.${exerciseIndex}.sets.${setIndex}.rpe` as `exercises.${number}.sets.${number}.rpe`, val);
          }}
          onClear={() => {
            form.setValue(`exercises.${exerciseIndex}.sets.${setIndex}.rpe` as `exercises.${number}.sets.${number}.rpe`, null);
            clearRpeDisplay(rpeKey);
          }}
        />
      )}

      {setErrorMsg && <p className="mt-0.5 text-center text-sm text-destructive">{setErrorMsg}</p>}
    </div>
  );
};
