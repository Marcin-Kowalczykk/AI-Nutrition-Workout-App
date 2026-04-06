"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFormContext, useFieldArray, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator, Pencil, Check, X, Info, Camera } from "lucide-react";

//libs
import { cn } from "@/lib/utils";

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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/date-picker";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { ProductScannerDialog } from "@/components/diet/product-scanner-dialog";
import { AiAnalyzeDialog } from "@/components/diet/ai-analyze-dialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

//hooks
import { useCreateDietDay } from "./api/use-create-diet-day";
import { useUpdateDietDay } from "./api/use-update-diet-day";

//types
import {
  dietDayFormSchema,
  DietDayFormValues,
  DietProductFormValues,
  DEFAULT_MEAL,
  DEFAULT_PRODUCT,
} from "./types";
import type { IDietDay } from "@/app/api/diet/types";

//helpers
import { buildDietDayPayload } from "./helpers/build-diet-day-payload";
import { dietDayToFormValues } from "./helpers/diet-day-to-form-values";

interface DaySummaryProps {
  control: Control<DietDayFormValues>;
}

const DaySummary = ({ control }: DaySummaryProps) => {
  const meals = useWatch({ control, name: "meals" });
  const totals = useMemo(
    () =>
      (meals ?? [])
        .flatMap((m) => m.products)
        .reduce(
          (acc, p) => ({
            kcal: acc.kcal + (parseFloat(p.product_kcal) || 0),
            protein: acc.protein + (parseFloat(p.protein_value) || 0),
            carbs: acc.carbs + (parseFloat(p.carbs_value) || 0),
            fat: acc.fat + (parseFloat(p.fat_value) || 0),
          }),
          { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        ),
    [meals]
  );

  return (
    <div className="border rounded-md px-3 py-2 bg-muted/30">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-sm text-foreground">{totals.kcal.toFixed(0)} kcal</span>
        {" · "}P: {totals.protein.toFixed(1)}g · C: {totals.carbs.toFixed(1)}g · F: {totals.fat.toFixed(1)}g
      </p>
    </div>
  );
};

interface ProductFieldsProps {
  mealIndex: number;
  productIndex: number;
  control: Control<DietDayFormValues>;
  onRemove: () => void;
  onSave: () => void;
}

const ProductFields = ({
  mealIndex,
  productIndex,
  control,
  onRemove,
  onSave,
}: ProductFieldsProps) => {
  const { setValue, getValues, formState: { isDirty }, trigger } = useFormContext<DietDayFormValues>();

  const [calcOpen, setCalcOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [clearCalcConfirmOpen, setClearCalcConfirmOpen] = useState(false);
  const snapshotRef = useRef<DietProductFormValues | null>(null);

  const [mode, setMode] = useState<"view" | "edit">(() => {
    const name = getValues(`meals.${mealIndex}.products.${productIndex}.product_name`);
    return name ? "view" : "edit";
  });

  const productName = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.product_name` });
  const productKcal = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.product_kcal` });

  const proteinValue = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.protein_value` });
  const carbsValue = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.carbs_value` });
  const fatValue = useWatch({ control, name: `meals.${mealIndex}.products.${productIndex}.fat_value` });

  const enterEdit = () => {
    snapshotRef.current = getValues(`meals.${mealIndex}.products.${productIndex}`);
    const snap = snapshotRef.current;
    if (snap && (snap.weight_grams || snap.kcal_per_100g || snap.protein_per_100g)) {
      setCalcOpen(true);
    }
    setMode("edit");
  };

  const cancelEdit = () => {
    if (snapshotRef.current) {
      const snap = snapshotRef.current;
      (
        [
          "product_name",
          "product_kcal",
          "protein_value",
          "carbs_value",
          "fat_value",
          "weight_grams",
          "kcal_per_100g",
          "protein_per_100g",
          "carbs_per_100g",
          "fat_per_100g",
        ] as const
      ).forEach((f) => {
        setValue(
          `meals.${mealIndex}.products.${productIndex}.${f}`,
          snap[f] ?? "",
          { shouldDirty: true }
        );
      });
    }
    setCalcOpen(false);
    const name = getValues(`meals.${mealIndex}.products.${productIndex}.product_name`);
    if (!name) {
      onRemove();
      return;
    }
    setMode("view");
  };

  const saveEdit = async () => {
    const isValid = await trigger([
      `meals.${mealIndex}.products.${productIndex}.product_name`,
      `meals.${mealIndex}.products.${productIndex}.product_kcal`,
      `meals.${mealIndex}.products.${productIndex}.protein_value`,
      `meals.${mealIndex}.products.${productIndex}.carbs_value`,
      `meals.${mealIndex}.products.${productIndex}.fat_value`,
    ]);
    if (!isValid) return;
    setMode("view");
    if (isDirty) onSave();
  };

  const hasCalcData = () => {
    const vals = getValues(`meals.${mealIndex}.products.${productIndex}`);
    return !!(vals.weight_grams || vals.kcal_per_100g || vals.protein_per_100g || vals.carbs_per_100g || vals.fat_per_100g);
  };

  const handleMainInputFocus = () => {
    if (hasCalcData()) {
      setClearCalcConfirmOpen(true);
    }
  };

  const handleClearCalcConfirm = () => {
    (["weight_grams", "kcal_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"] as const).forEach((f) => {
      setValue(`meals.${mealIndex}.products.${productIndex}.${f}`, "", { shouldDirty: true });
    });
    setCalcOpen(false);
    setClearCalcConfirmOpen(false);
  };

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

  const handleRemoveClick = () => {
    if (productName || productKcal) {
      setRemoveConfirmOpen(true);
    } else {
      onRemove();
    }
  };

  const handleScanApply = ({
    kcal,
    protein,
    carbs,
    fat,
  }: {
    kcal: string;
    protein: string;
    carbs: string;
    fat: string;
  }) => {
    setValue(
      `meals.${mealIndex}.products.${productIndex}.kcal_per_100g`,
      kcal,
      { shouldDirty: true }
    );
    setValue(
      `meals.${mealIndex}.products.${productIndex}.protein_per_100g`,
      protein,
      { shouldDirty: true }
    );
    setValue(
      `meals.${mealIndex}.products.${productIndex}.carbs_per_100g`,
      carbs,
      { shouldDirty: true }
    );
    setValue(
      `meals.${mealIndex}.products.${productIndex}.fat_per_100g`,
      fat,
      { shouldDirty: true }
    );
    recalculate();
  };

  const handleAnalyzeApply = ({
    kcal,
    protein,
    carbs,
    fat,
  }: {
    kcal: string;
    protein: string;
    carbs: string;
    fat: string;
  }) => {
    setValue(
      `meals.${mealIndex}.products.${productIndex}.product_kcal`,
      kcal,
      { shouldDirty: true }
    );
    setValue(
      `meals.${mealIndex}.products.${productIndex}.protein_value`,
      protein,
      { shouldDirty: true }
    );
    setValue(
      `meals.${mealIndex}.products.${productIndex}.carbs_value`,
      carbs,
      { shouldDirty: true }
    );
    setValue(
      `meals.${mealIndex}.products.${productIndex}.fat_value`,
      fat,
      { shouldDirty: true }
    );
  };

  return (
    <div className="flex flex-col gap-1.5 border-t pt-2">
      <ConfirmModal
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title="Remove product?"
        description="This product has data. Are you sure you want to remove it?"
        confirmLabel="Remove"
        confirmVariant="destructive"
        onConfirm={() => {
          setRemoveConfirmOpen(false);
          onRemove();
        }}
      />

      <ConfirmModal
        open={clearCalcConfirmOpen}
        onOpenChange={setClearCalcConfirmOpen}
        title="Clear calculator?"
        description="Editing these values manually will clear all calculator fields. Do you want to continue?"
        confirmLabel="Continue"
        confirmVariant="default"
        onConfirm={handleClearCalcConfirm}
      />

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Calculator</DialogTitle>
            <DialogDescription>
              Enter portion weight and macros per 100 g — values above will be
              filled automatically.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {mode === "view" ? (
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-medium truncate">{productName}</p>
            <p className="text-xs text-muted-foreground">
              {productKcal} kcal · P: {proteinValue}g · C: {carbsValue}g · F: {fatValue}g
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={enterEdit}
              className="h-7 w-7"
              aria-label={`Edit product ${productIndex + 1}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {!!(productName || productKcal) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveClick}
                className="h-7 w-7 text-destructive hover:text-destructive"
                aria-label={`Remove product ${productIndex + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 border-l-2 border-primary-element pl-2">
          <div className="flex items-end justify-between gap-1">
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.product_name`}
              render={({ field }) => (
                <FormItem className="space-y-1 flex-1">
                  <FormLabel className="text-xs">Product name</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={1}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-base md:text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <div
              className={cn(
                "shrink-0 rounded-md p-[1.5px]",
                productName.trim().length < 3
                  ? "bg-muted"
                  : "bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400"
              )}
            >
              <Button
                type="button"
                size="sm"
                disabled={productName.trim().length < 3}
                onClick={() => setAiAnalyzeOpen(true)}
                className="h-8 px-2 text-xs font-bold bg-background hover:bg-muted/80 rounded-[4px] border-0"
              >
                AI
              </Button>
            </div>
            {!!(productName || productKcal) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveClick}
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                aria-label={`Remove product ${productIndex + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <FormField
              control={control}
              name={`meals.${mealIndex}.products.${productIndex}.product_kcal`}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Kcal</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8" />
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
                    <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8" />
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
                    <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8" />
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
                    <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8" />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCalcOpen((v) => !v)}
              className="h-6 w-fit px-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Calculator className="h-3 w-3 mr-1" />
              {calcOpen ? "Hide calculator" : "Calculate from 100g"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setInfoOpen(true)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              aria-label="Calculator info"
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          </div>

          {calcOpen && (
            <div className="flex flex-col gap-1.5 border border-dashed [border-left-style:solid] border-l-2 border-l-primary-element p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScanDialogOpen(true)}
                className="w-full h-7 text-xs gap-1.5"
              >
                <Camera className="h-3 w-3" />
                Scan product to fill 100g values{" "}
                <span className="text-primary-element">(Open camera)</span>
              </Button>
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
                        onChange={(e) => {
                          field.onChange(e);
                          recalculate();
                        }}
                        className="h-8"
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
                        onChange={(e) => {
                          field.onChange(e);
                          recalculate();
                        }}
                        className="h-8"
                      />
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
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
                        onChange={(e) => {
                          field.onChange(e);
                          recalculate();
                        }}
                        className="h-8"
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
                        onChange={(e) => {
                          field.onChange(e);
                          recalculate();
                        }}
                        className="h-8"
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
                        onChange={(e) => {
                          field.onChange(e);
                          recalculate();
                        }}
                        className="h-8"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={saveEdit}
              disabled={!productName}
              className="h-8 px-3 text-xs gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              className="h-8 px-3 text-xs gap-1 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}
      <ProductScannerDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onApply={handleScanApply}
      />
      <AiAnalyzeDialog
        open={aiAnalyzeOpen}
        onOpenChange={setAiAnalyzeOpen}
        productName={productName || ""}
        onApply={handleAnalyzeApply}
      />
    </div>
  );
};

interface MealSectionProps {
  mealIndex: number;
  control: Control<DietDayFormValues>;
  onRemoveMeal: () => void;
  onSave: () => void;
}

const MealSection = ({
  mealIndex,
  control,
  onRemoveMeal,
  onSave,
}: MealSectionProps) => {
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: `meals.${mealIndex}.products`,
  });

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const mealProducts = useWatch({ control, name: `meals.${mealIndex}.products` });
  const mealTotals = useMemo(
    () =>
      (mealProducts ?? []).reduce(
        (acc, p) => ({
          kcal: acc.kcal + (parseFloat(p.product_kcal) || 0),
          protein: acc.protein + (parseFloat(p.protein_value) || 0),
          carbs: acc.carbs + (parseFloat(p.carbs_value) || 0),
          fat: acc.fat + (parseFloat(p.fat_value) || 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [mealProducts]
  );

  const handleRemoveMealClick = () => {
    const hasFilled = mealProducts.some((p) => p.product_name || p.product_kcal);
    if (hasFilled) {
      setRemoveConfirmOpen(true);
    } else {
      onRemoveMeal();
    }
  };

  return (
    <Card>
      <CardContent className="p-3 flex flex-col gap-2">
        <ConfirmModal
          open={removeConfirmOpen}
          onOpenChange={setRemoveConfirmOpen}
          title="Remove meal?"
          description="This meal has data. Are you sure you want to remove it?"
          confirmLabel="Remove"
          confirmVariant="destructive"
          onConfirm={() => { setRemoveConfirmOpen(false); onRemoveMeal(); }}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-primary-element shrink-0" />
            <p className="font-medium text-sm">Meal {mealIndex + 1}</p>
            <p className="text-xs text-muted-foreground truncate">
              {mealTotals.kcal.toFixed(0)} kcal · P: {mealTotals.protein.toFixed(1)}g · C:{" "}
              {mealTotals.carbs.toFixed(1)}g · F: {mealTotals.fat.toFixed(1)}g
            </p>
          </div>
          {(mealProducts ?? []).some((p) => p.product_name || p.product_kcal) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveMealClick}
              className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
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
            onSave={onSave}
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

              <div className="flex flex-col gap-2">
                {mealFields.map((mealField, mealIndex) => (
                  <MealSection
                    key={mealField.id}
                    mealIndex={mealIndex}
                    control={form.control}
                    onRemoveMeal={() => removeMeal(mealIndex)}
                    onSave={handleProductSave}
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
