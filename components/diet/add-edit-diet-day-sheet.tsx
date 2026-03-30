"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

//components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/date-picker";
import { toast } from "sonner";

//hooks
import { useCreateDietDay } from "./api/use-create-diet-day";
import { useUpdateDietDay } from "./api/use-update-diet-day";

//types
import {
  dietDayFormSchema,
  DietDayFormValues,
  DEFAULT_PRODUCT,
} from "./types";
import type { IDietDay } from "@/app/api/diet/types";

//helpers
import { buildDietDayPayload } from "./helpers/build-diet-day-payload";
import { dietDayToFormValues } from "./helpers/diet-day-to-form-values";

interface MealSectionProps {
  mealIndex: number;
  control: Control<DietDayFormValues>;
  onRemoveMeal: () => void;
  showRemoveMeal: boolean;
}

const MealSection = ({
  mealIndex,
  control,
  onRemoveMeal,
  showRemoveMeal,
}: MealSectionProps) => {
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: `meals.${mealIndex}.products`,
  });

  return (
    <div className="border rounded-md p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Meal {mealIndex + 1}</p>
        {showRemoveMeal && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemoveMeal}
            className="h-7 w-7 text-destructive hover:text-destructive"
            aria-label={`Remove meal ${mealIndex + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {productFields.map((productField, productIndex) => (
        <div key={productField.id} className="flex flex-col gap-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Product {productIndex + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeProduct(productIndex)}
              className="h-6 w-6 text-destructive hover:text-destructive"
              aria-label={`Remove product ${productIndex + 1}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <FormField
            control={control}
            name={`meals.${mealIndex}.products.${productIndex}.product_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Chicken breast" />
                </FormControl>
                <FormMessage className="text-destructive" />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.product_kcal`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kcal</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.protein_value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protein [g]</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.carbs_value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carbs [g]</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.fat_value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fat [g]</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendProduct({ ...DEFAULT_PRODUCT })}
        className="w-full mt-1"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add product
      </Button>
    </div>
  );
};

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

  const form = useForm<DietDayFormValues>({
    resolver: zodResolver(dietDayFormSchema),
    defaultValues: {
      date: new Date(),
      meals: [{ products: [{ ...DEFAULT_PRODUCT }] }],
    },
    mode: "onChange",
  });

  const {
    fields: mealFields,
    append: appendMeal,
    remove: removeMeal,
  } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  const { mutate: createDay, isPending: isCreating } = useCreateDietDay({
    onSuccess: () => {
      toast.success("Diet day saved");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err || "Failed to save diet day"),
  });

  const { mutate: updateDay, isPending: isUpdating } = useUpdateDietDay({
    onSuccess: () => {
      toast.success("Diet day updated");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err || "Failed to update diet day"),
  });

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (isEditing && dayToEdit) {
      form.reset(dietDayToFormValues(dayToEdit));
    } else {
      form.reset({
        date: new Date(),
        meals: [{ products: [{ ...DEFAULT_PRODUCT }] }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (values: DietDayFormValues) => {
    const payload = buildDietDayPayload(values);
    if (isEditing && dayToEdit) {
      updateDay({ ...payload, id: dayToEdit.id });
    } else {
      createDay(payload);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex max-h-full w-full flex-col gap-0 overflow-auto p-0 sm:w-[70%] sm:max-w-[600px]">
        <SheetHeader className="border-b p-6">
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
            <div className="flex-1 space-y-6 p-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
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

              <div className="flex flex-col gap-4">
                {mealFields.map((mealField, mealIndex) => (
                  <MealSection
                    key={mealField.id}
                    mealIndex={mealIndex}
                    control={form.control}
                    onRemoveMeal={() => removeMeal(mealIndex)}
                    showRemoveMeal={mealFields.length > 1}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendMeal({ products: [{ ...DEFAULT_PRODUCT }] })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add meal
                </Button>
              </div>
            </div>

            <SheetFooter className="border-t p-6">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
