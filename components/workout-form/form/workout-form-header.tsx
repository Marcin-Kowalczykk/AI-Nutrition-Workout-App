"use client";

//libs
import { format, startOfDay, subDays } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

//hooks
import type { UseFormReturn } from "react-hook-form";

//components
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";

//types
import type { CreateWorkoutFormType } from "../types";

interface WorkoutFormHeaderProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  isTemplateMode: boolean;
  isPending: boolean;
  headerVisible: boolean;
  onToggleHeader: () => void;
}

export const WorkoutFormHeader = ({
  form,
  isTemplateMode,
  isPending,
  headerVisible,
  onToggleHeader,
}: WorkoutFormHeaderProps) => {
  const workoutName = form.watch("name") ?? "";

  if (!headerVisible) {
    return workoutName.toString().trim() ? (
      <div className="flex justify-end">
        <Button type="button" variant="showHide" size="showHide" onClick={onToggleHeader}>
          <span className="flex items-center gap-1"><span>Header</span><ChevronDown className="h-3 w-3" /></span>
        </Button>
      </div>
    ) : null;
  }

  return (
    <>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <span>{isTemplateMode ? "Template name" : "Workout Name"}*</span>
              {workoutName.toString().trim() && (
                <Button type="button" variant="showHide" size="showHide" onClick={onToggleHeader}>
                  <span className="flex items-center gap-1"><span>Header</span><ChevronUp className="h-3 w-3" /></span>
                </Button>
              )}
            </FormLabel>
            <FormControl><Input {...field} type="text" autoComplete="off" disabled={isPending} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="description"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea {...field} autoComplete="off" disabled={isPending} rows={1} className="resize-y" /></FormControl>
            <FormDescription>Optional description for your workout</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isTemplateMode && (
        <FormField
          name="workout_date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout date</FormLabel>
              <FormControl>
                <DatePicker
                  label=""
                  value={field.value ? new Date(field.value + "T12:00:00") : undefined}
                  onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
                  placeholder="choose date"
                  showClear={false}
                  fromYear={new Date().getFullYear() - 1}
                  toYear={new Date().getFullYear()}
                  disabled={(date) => {
                    const d = startOfDay(date);
                    const today = startOfDay(new Date());
                    return d < subDays(today, 365) || d > today;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
