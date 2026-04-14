"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator, Camera, Check, Mic, X } from "lucide-react";
import {
  useFormContext,
  useWatch,
  type Control,
} from "react-hook-form";

//libs
import { cn } from "@/lib/utils";

//hooks
import { useProductCalculator } from "../hooks/use-product-calculator";
import { useProductEditMode } from "../hooks/use-product-edit-mode";

//types
import type { DietDayFormValues, DietProductFormValues } from "@/components/diet-history/types";
import { DEFAULT_PRODUCT } from "@/components/diet-history/types";
import type { ProductAnalysis } from "@/components/shared/diet/types";

//components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { InfoButton } from "@/components/shared/info-button";
import { ProductView } from "./product-view";
import { AiAnalyzeDialog } from "../dialogs/ai-analyze-dialog";
import { ProductScannerDialog } from "../dialogs/product-scanner";
import { VoiceInputDialog } from "@/components/shared/diet/voice-input-dialog";

interface ProductFieldsProps {
  mealIndex: number;
  productIndex: number;
  control: Control<DietDayFormValues>;
  onRemove: () => void;
  onSave: () => void;
  appendProduct: (product: DietProductFormValues) => void;
  isEditing: boolean;
}

export const ProductFields = ({
  mealIndex,
  productIndex,
  control,
  onRemove,
  onSave,
  appendProduct,
  isEditing,
}: ProductFieldsProps) => {
  const { setValue } = useFormContext<DietDayFormValues>();

  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [aiAnalyzeOpen, setAiAnalyzeOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    calcOpen,
    setCalcOpen,
    clearCalcConfirmOpen,
    setClearCalcConfirmOpen,
    recalculate,
    handleClearCalcConfirm,
    handleMainInputFocus,
  } = useProductCalculator({ mealIndex, productIndex });

  const {
    mode,
    removeConfirmOpen,
    setRemoveConfirmOpen,
    enterEdit,
    cancelEdit,
    saveEdit,
    handleRemoveClick,
  } = useProductEditMode({
    mealIndex,
    productIndex,
    onRemove,
    onSave,
    isEditing,
    setCalcOpen,
  });

  const productName = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.product_name`,
  });

  const productKcal = useWatch({
    control,
    name: `meals.${mealIndex}.products.${productIndex}.product_kcal`,
  });

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [productName]);

  useEffect(() => {
    if (mode === "edit") {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    }
  }, [mode]);

  const handleScanApply = ({
    kcal,
    protein,
    carbs,
    fat,
    grams,
  }: {
    kcal: string;
    protein: string;
    carbs: string;
    fat: string;
    grams?: string;
  }) => {
    if (grams) {
      setValue(`meals.${mealIndex}.products.${productIndex}.product_kcal`, kcal, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.protein_value`, protein, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.carbs_value`, carbs, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.fat_value`, fat, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.weight_grams`, grams, { shouldDirty: true });
    } else {
      setValue(`meals.${mealIndex}.products.${productIndex}.kcal_per_100g`, kcal, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.protein_per_100g`, protein, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.carbs_per_100g`, carbs, { shouldDirty: true });
      setValue(`meals.${mealIndex}.products.${productIndex}.fat_per_100g`, fat, { shouldDirty: true });
      recalculate();
    }
  };

  const handleAnalyzeApply = (products: ProductAnalysis[]) => {
    const first = products[0];
    setValue(`meals.${mealIndex}.products.${productIndex}.product_name`, first.product_name, { shouldDirty: true });
    setValue(`meals.${mealIndex}.products.${productIndex}.product_kcal`, first.kcal, { shouldDirty: true });
    setValue(`meals.${mealIndex}.products.${productIndex}.protein_value`, first.protein, { shouldDirty: true });
    setValue(`meals.${mealIndex}.products.${productIndex}.carbs_value`, first.carbs, { shouldDirty: true });
    setValue(`meals.${mealIndex}.products.${productIndex}.fat_value`, first.fat, { shouldDirty: true });
    setValue(`meals.${mealIndex}.products.${productIndex}.ai_breakdown`, first.breakdown ?? null, { shouldDirty: true });
    if (first.weight_grams) {
      setValue(`meals.${mealIndex}.products.${productIndex}.weight_grams`, first.weight_grams, { shouldDirty: true });
    }
    for (let i = 1; i < products.length; i++) {
      appendProduct({
        ...DEFAULT_PRODUCT,
        product_name: products[i].product_name,
        product_kcal: products[i].kcal,
        protein_value: products[i].protein,
        carbs_value: products[i].carbs,
        fat_value: products[i].fat,
        weight_grams: products[i].weight_grams || "",
        ai_breakdown: products[i].breakdown ?? null,
      });
    }
    saveEdit();
  };

  if (mode === "view") {
    return (
      <>
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
            if (isEditing) onSave();
          }}
        />
        <ProductView
          mealIndex={mealIndex}
          productIndex={productIndex}
          control={control}
          onEdit={enterEdit}
          onRemove={handleRemoveClick}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
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
          if (isEditing) onSave();
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

      <div className="flex flex-col gap-1.5 bg-muted/50 pr-2 py-1.5">
        <div className="flex items-end justify-between gap-1">
          <FormField
            control={control}
            name={`meals.${mealIndex}.products.${productIndex}.product_name`}
            render={({ field }) => (
              <FormItem className="space-y-1 flex-1">
                <div className="flex items-center gap-1">
                  <FormLabel className="text-xs">Product name</FormLabel>
                  <InfoButton
                    title="Multiple products"
                    description="You can enter multiple products at once — the app will split them into separate entries automatically."
                    ariaLabel="Product name info"
                  >
                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Example:</p>
                      <p>chicken breast 200g, rice 100g, olive oil 10g</p>
                      <p className="mt-1">or one per line:</p>
                      <p>chicken breast 200g</p>
                      <p>rice 100g</p>
                      <p>olive oil 10g</p>
                    </div>
                  </InfoButton>
                </div>
                <FormControl>
                  <div className="relative">
                    <textarea
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        textareaRef.current = el;
                      }}
                      aria-label="Product name"
                      rows={1}
                      className="flex w-full rounded-md border border-input bg-card px-3 py-1.5 pr-8 text-base md:text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }}
                    />
                    {field.value && (
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("");
                          const el = textareaRef.current;
                          if (el) {
                            el.style.height = "auto";
                          }
                        }}
                        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear product name"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-destructive" />
              </FormItem>
            )}
          />
          <div className="shrink-0 p-[1.5px]">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setVoiceOpen(true)}
              className="h-8 w-8 border border-input hover:border-primary-element hover:text-primary-element"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
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
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <FormField
            control={control}
            name={`meals.${mealIndex}.products.${productIndex}.product_kcal`}
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">Kcal</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8 text-primary-element font-semibold" />
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
                <FormLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">Protein</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8 text-macro-protein font-semibold" />
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
                <FormLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">Carbs</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8 text-macro-carbs font-semibold" />
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
                <FormLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">Fat</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} onFocus={handleMainInputFocus} className="h-8 text-macro-fat font-semibold" />
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
          <InfoButton
            title="Calculator"
            description="Enter portion weight and macros per 100 g — values above will be filled automatically."
            ariaLabel="Calculator info"
            className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
          />
        </div>

        {calcOpen && (
          <div className="flex flex-col gap-1.5 border-l-2 border-primary-element py-1 pl-3">
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
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Grams</label>
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
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Kcal/100g</label>
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
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Protein/100g</label>
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
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Carbs/100g</label>
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
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Fat/100g</label>
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

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="gradient"
            size="sm"
            onClick={saveEdit}
            disabled={!productName}
            className="h-8 flex-1 text-xs gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelEdit}
            className="h-9 flex-1 text-xs gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      </div>

      <ProductScannerDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onApply={handleScanApply}
      />
      <AiAnalyzeDialog
        open={aiAnalyzeOpen}
        onOpenChange={setAiAnalyzeOpen}
        productName={productName ?? ""}
        onApply={handleAnalyzeApply}
      />
      <VoiceInputDialog
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onApply={(text) =>
          setValue(
            `meals.${mealIndex}.products.${productIndex}.product_name`,
            text,
            { shouldDirty: true }
          )
        }
      />
    </div>
  );
};
