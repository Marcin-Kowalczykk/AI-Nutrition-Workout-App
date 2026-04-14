"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

//libs
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

//hooks
import { useCreateDietDay } from "../api/use-create-diet-day";
import { useUpdateDietDay } from "../api/use-update-diet-day";

//types
import {
  dietDayFormSchema,
  type DietDayFormValues,
  DEFAULT_MEAL,
} from "@/components/diet-history/types";
import type { IDietDay } from "@/app/api/diet/types";

//helpers
import { buildDietDayPayload } from "../helpers/build-diet-day-payload";
import { dietDayToFormValues } from "../helpers/diet-day-to-form-values";
import { applyProductDrop, mergeMealsAtIndices } from "../helpers/diet-dnd-helpers";

//components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Loader } from "@/components/shared/loader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { DaySummary } from "./components/day-summary";
import { MealSection } from "./components/meal-section";

interface AddEditDietDaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayToEdit?: IDietDay | null;
}

export const AddEditDietDaySheet = ({
  open,
  onOpenChange,
  dayToEdit = null,
}: AddEditDietDaySheetProps) => {
  const isEditing = dayToEdit !== null;
  const closeOnSuccessRef = useRef(true);

  const form = useForm<DietDayFormValues>({
    resolver: zodResolver(dietDayFormSchema),
    defaultValues: {
      date: new Date(),
      meals: [{ ...DEFAULT_MEAL }],
    },
    mode: "onSubmit",
  });

  const {
    fields: mealFields,
    append: appendMeal,
    remove: removeMeal,
  } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  const [lastAddedMealIndex, setLastAddedMealIndex] = useState<number | null>(null);
  const [mealExpandedById, setMealExpandedById] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    })
  );

  const handleDietDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.type === "meal") {
      const sourceIdx = mealFields.findIndex((f) => f.id === active.id);
      if (sourceIdx < 0) return;
      const overId = String(over.id);
      if (overId.startsWith("meal-merge-")) {
        const targetId = overId.slice("meal-merge-".length);
        const targetIdx = mealFields.findIndex((f) => f.id === targetId);
        if (targetIdx >= 0 && sourceIdx !== targetIdx) {
          const targetFieldId = mealFields[targetIdx]?.id;
          const nextMeals = mergeMealsAtIndices(form.getValues("meals"), sourceIdx, targetIdx);
          form.setValue("meals", nextMeals, { shouldDirty: true });
          if (targetFieldId) {
            setMealExpandedById((m) => ({ ...m, [targetFieldId]: true }));
          }
        }
        return;
      }
      return;
    }

    if (activeData?.type === "product") {
      const fromM = activeData.mealIndex as number;
      const fromP = activeData.productIndex as number;
      const overData = over.data.current;

      if (overData?.type === "meal") {
        return;
      }

      let toM: number;
      let toP: number;

      if (overData?.type === "meal-merge") {
        toM = overData.mealIndex as number;
        toP = form.getValues(`meals.${toM}.products`).length;
      } else if (overData?.type === "drop-end") {
        toM = overData.mealIndex as number;
        toP = form.getValues(`meals.${toM}.products`).length;
      } else if (overData?.type === "product") {
        toM = overData.mealIndex as number;
        toP = overData.productIndex as number;
      } else {
        return;
      }

      if (fromM === toM && fromP === toP) return;

      const targetFieldId = mealFields[toM]?.id;
      const next = applyProductDrop(form.getValues("meals"), fromM, fromP, toM, toP);
      form.setValue("meals", next, { shouldDirty: true });
      if (targetFieldId) {
        setMealExpandedById((m) => ({ ...m, [targetFieldId]: true }));
      }
    }
  };

  const { mutate: createDay, isPending: isCreating } = useCreateDietDay({
    onSuccess: () => {
      toast.success("Diet day saved");
      if (closeOnSuccessRef.current) onOpenChange(false);
      closeOnSuccessRef.current = true;
    },
    onError: (err) => toast.error(err || "Failed to save diet day"),
  });

  const { mutate: updateDay, isPending: isUpdating } = useUpdateDietDay({
    onSuccess: () => {
      toast.success("Diet day updated");
      if (closeOnSuccessRef.current) onOpenChange(false);
      closeOnSuccessRef.current = true;
    },
    onError: (err) => toast.error(err || "Failed to update diet day"),
  });

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    setMealExpandedById({});
    if (isEditing && dayToEdit) {
      form.reset(dietDayToFormValues(dayToEdit));
    } else {
      form.reset({
        date: new Date(),
        meals: [{ ...DEFAULT_MEAL }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleViewportResize = () => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.visualViewport?.addEventListener("resize", handleViewportResize);
    return () => window.visualViewport?.removeEventListener("resize", handleViewportResize);
  }, [open]);

  const onSubmit = (values: DietDayFormValues) => {
    const payload = buildDietDayPayload(values);
    if (isEditing && dayToEdit) {
      updateDay({ ...payload, id: dayToEdit.id });
    } else {
      createDay(payload);
    }
  };

  const handleProductSave = () => {
    closeOnSuccessRef.current = false;
    form.handleSubmit(onSubmit)();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex max-h-full w-full flex-col gap-0 overflow-auto p-0 sm:w-[70%] sm:max-w-[600px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="m-0">
            {isEditing ? "Edit diet day" : "Add diet day"}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-auto"
            noValidate
          >
            <div className="flex-1 flex flex-col gap-3 p-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={(date) => date > new Date()}
                        showClear={false}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <DaySummary control={form.control} />

              <div className="border rounded-md overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={pointerWithin}
                  onDragEnd={handleDietDragEnd}
                >
                  <div className="flex flex-col divide-y divide-border">
                    {mealFields.map((mealField, mealIndex) => {
                      const defaultExpanded =
                        mealIndex === lastAddedMealIndex ||
                        (!isEditing && mealIndex === 0);
                      const expanded =
                        mealField.id in mealExpandedById
                          ? mealExpandedById[mealField.id]!
                          : defaultExpanded;
                      return (
                        <MealSection
                          key={mealField.id}
                          mealFieldId={mealField.id}
                          mealIndex={mealIndex}
                          totalMeals={mealFields.length}
                          control={form.control}
                          onRemoveMeal={() => removeMeal(mealIndex)}
                          onSave={handleProductSave}
                          expanded={expanded}
                          onExpandedChange={(next) =>
                            setMealExpandedById((m) => ({
                              ...m,
                              [mealField.id]: next,
                            }))
                          }
                          isEditing={isEditing}
                        />
                      );
                    })}
                  </div>
                </DndContext>

                <div className="border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLastAddedMealIndex(mealFields.length);
                      appendMeal({ ...DEFAULT_MEAL });
                    }}
                    className="w-full h-9 text-xs text-muted-foreground hover:text-foreground rounded-none"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add meal
                  </Button>
                </div>
              </div>
            </div>

            <SheetFooter className="border-t px-4 py-3">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? <Loader size={16} /> : null}
                {isPending
                  ? isEditing ? "Updating…" : "Saving…"
                  : isEditing ? "Update" : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
