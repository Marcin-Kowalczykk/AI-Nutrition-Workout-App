"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFormContext, useFieldArray, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator } from "lucide-react";

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
import { Card, CardContent } from "@/components/ui/card";
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
  DEFAULT_MEAL,
  DEFAULT_PRODUCT,
} from "./types";
import type { IDietDay } from "@/app/api/diet/types";

//helpers
import { buildDietDayPayload } from "./helpers/build-diet-day-payload";
import { dietDayToFormValues } from "./helpers/diet-day-to-form-values";

interface ProductFieldsProps {
  mealIndex: number;
  productIndex: number;
  control: Control<DietDayFormValues>;
  onRemove: () => void;
  showRemove: boolean;
}

const ProductFields = ({
  mealIndex,
  productIndex,
  control,
  onRemove,
  showRemove,
}: ProductFieldsProps) => {
  const { setValue, getValues } = useFormContext<DietDayFormValues>();

  const [calcOpen, setCalcOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  const weightGrams = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.weight_grams` });
  const kcalPer100 = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.kcal_per_100g` });
  const proteinPer100 = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.protein_per_100g` });
  const carbsPer100 = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.carbs_per_100g` });
  const fatPer100 = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.fat_per_100g` });

  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (weightGrams || kcalPer100 || proteinPer100 || carbsPer100 || fatPer100) {
      setCalcOpen(true);
      autoOpenedRef.current = true;
    }
  }, [weightGrams, kcalPer100, proteinPer100, carbsPer100, fatPer100]);

  const recalculate = () => {
    const g = parseFloat(getValues(`meals.${mealIndex}.products.${productIndex}.weight_grams`) || "");
    if (!g || g <= 0) return;
    const factor = g / 100;

    const kcal = parseFloat(getValues(`meals.${mealIndex}.products.${productIndex}.kcal_per_100g`) || "");
    const protein = parseFloat(getValues(`meals.${mealIndex}.products.${productIndex}.protein_per_100g`) || "");
    const carbs = parseFloat(getValues(`meals.${mealIndex}.products.${productIndex}.carbs_per_100g`) || "");
    const fat = parseFloat(getValues(`meals.${mealIndex}.products.${productIndex}.fat_per_100g`) || "");

    if (!isNaN(kcal))
      setValue(`meals.${mealIndex}.products.${productIndex}.product_kcal`, String((kcal * factor).toFixed(2)), { shouldDirty: true });
    if (!isNaN(protein))
      setValue(`meals.${mealIndex}.products.${productIndex}.protein_value`, String((protein * factor).toFixed(2)), { shouldDirty: true });
    if (!isNaN(carbs))
      setValue(`meals.${mealIndex}.products.${productIndex}.carbs_value`, String((carbs * factor).toFixed(2)), { shouldDirty: true });
    if (!isNaN(fat))
      setValue(`meals.${mealIndex}.products.${productIndex}.fat_value`, String((fat * factor).toFixed(2)), { shouldDirty: true });
  };

  return (
    <div className="flex flex-col gap-1.5 border-t pt-2">
      <FormField
        control={control}
        name={`meals.${mealIndex}.products.${productIndex}.product_name`}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-xs">Product name</FormLabel>
            <div className="flex items-start gap-1">
              <FormControl>
                <textarea
                  {...field}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
              </FormControl>
              {showRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  aria-label={`Remove product ${productIndex + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <FormMessage className="text-destructive" />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-1.5">
        <FormField
          control={control}
          name={`meals.${mealIndex}.products.${productIndex}.product_kcal`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Kcal</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`meals.${mealIndex}.products.${productIndex}.protein_value`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Protein [g]</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`meals.${mealIndex}.products.${productIndex}.carbs_value`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Carbs [g]</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`meals.${mealIndex}.products.${productIndex}.fat_value`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Fat [g]</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setCalcOpen((v) => !v)}
        className="h-6 w-fit px-1.5 text-xs text-muted-foreground hover:text-foreground self-start"
      >
        <Calculator className="h-3 w-3 mr-1" />
        {calcOpen ? "Hide calculator" : "Calculate from 100g"}
      </Button>

      {calcOpen && (
        <div className="flex flex-col gap-1.5 rounded-md border border-dashed p-2">
          <p className="text-xs text-muted-foreground">
            Enter portion weight and macros per 100 g — values above will be filled automatically.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.weight_grams`}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Grams</label>
                  <Input
                    type="number"
                    step="1"
                    min={0}
                    {...field}
                    onChange={(e) => { field.onChange(e); recalculate(); }}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.kcal_per_100g`}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Kcal / 100g</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    onChange={(e) => { field.onChange(e); recalculate(); }}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.protein_per_100g`}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Protein / 100g</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    onChange={(e) => { field.onChange(e); recalculate(); }}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.carbs_per_100g`}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Carbs / 100g</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    onChange={(e) => { field.onChange(e); recalculate(); }}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.fat_per_100g`}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Fat / 100g</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    onChange={(e) => { field.onChange(e); recalculate(); }}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};

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
    <Card>
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">Meal {mealIndex + 1}</p>
          {showRemoveMeal && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemoveMeal}
              className="h-6 w-6 text-destructive hover:text-destructive"
              aria-label={`Remove meal ${mealIndex + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {productFields.map((productField, productIndex) => (
          <ProductFields
            key={productField.id}
            mealIndex={mealIndex}
            productIndex={productIndex}
            control={control}
            onRemove={() => removeProduct(productIndex)}
            showRemove={productFields.length > 1}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendProduct({ ...DEFAULT_PRODUCT })}
          className="w-full h-7 text-xs mt-1"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add product
        </Button>
      </CardContent>
    </Card>
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
      meals: [{ ...DEFAULT_MEAL }],
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
        meals: [{ ...DEFAULT_MEAL }],
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

              <div className="flex flex-col gap-2">
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
                  onClick={() => appendMeal({ ...DEFAULT_MEAL })}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add meal
                </Button>
              </div>
            </div>

            <SheetFooter className="border-t px-4 py-3">
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
