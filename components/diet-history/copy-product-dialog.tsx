"use client";

import { useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { Copy } from "lucide-react";

//libs
import { toast } from "sonner";

//components
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/shared/date-picker";
import { Loader } from "@/components/shared/loader";

//hooks
import { useCopyProduct } from "./api/use-copy-product";
import { useGetDietHistory } from "./api/use-get-diet-history";

//types
import type { IDietProduct } from "@/app/api/diet/types";

const NEW_MEAL_VALUE = "__new_meal__";

interface CopyProductDialogProps {
  product: IDietProduct | null;
  onOpenChange: (open: boolean) => void;
}

export const CopyProductDialog = ({ product, onOpenChange }: CopyProductDialogProps) => {
  const [mode, setMode] = useState<"today" | "custom">("today");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [mealChoice, setMealChoice] = useState<string>(NEW_MEAL_VALUE);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMode("today");
      setCustomDate(undefined);
      setMealChoice(NEW_MEAL_VALUE);
    }
    onOpenChange(open);
  };

  const targetDateStr = useMemo(() => {
    if (mode === "today") {
      return format(new Date(), "yyyy-MM-dd");
    }
    return customDate ? format(customDate, "yyyy-MM-dd") : null;
  }, [mode, customDate]);

  const { data: dayForTarget, isFetching: isDayLoading } = useGetDietHistory({
    startDate: targetDateStr ?? undefined,
    endDate: targetDateStr ?? undefined,
    enabled: product !== null && targetDateStr !== null,
  });

  const targetDay = dayForTarget?.days?.[0];
  const mealsForTarget = useMemo(() => {
    if (!targetDay || targetDay.date !== targetDateStr) return [];
    return targetDay.diet_meals;
  }, [targetDay, targetDateStr]);

  const resolvedMealChoice = useMemo(() => {
    if (mealChoice === NEW_MEAL_VALUE) return NEW_MEAL_VALUE;
    if (mealsForTarget.some((m) => m.id === mealChoice)) return mealChoice;
    return NEW_MEAL_VALUE;
  }, [mealChoice, mealsForTarget]);

  const { mutate: copyProduct, isPending } = useCopyProduct({
    onSuccess: () => {
      toast.success("Product copied");
      handleOpenChange(false);
    },
    onError: (err) => {
      toast.error(err || "Failed to copy product");
    },
  });

  const handleCopy = () => {
    if (!product || !targetDateStr) return;

    copyProduct({
      product_id: product.id,
      target_date: targetDateStr,
      target_meal_id:
        resolvedMealChoice === NEW_MEAL_VALUE ? null : resolvedMealChoice,
    });
  };

  const isCopyDisabled = isPending || (mode === "custom" && !customDate);

  return (
    <Dialog open={product !== null} onOpenChange={handleOpenChange} preventOverlayClose={isPending}>
      <DialogContent
        isCloseButtonVisible={!isPending}
        className="sm:mx-2 max-w-sm rounded-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy product
          </DialogTitle>
          {product && (
            <p className="text-sm text-muted-foreground font-normal truncate pr-6">
              {product.product_name}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex gap-2">
            <Button
              variant={mode === "today" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setMode("today");
                setCustomDate(undefined);
                setMealChoice(NEW_MEAL_VALUE);
              }}
              disabled={isPending}
            >
              Today
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setMode("custom");
                setMealChoice(NEW_MEAL_VALUE);
              }}
              disabled={isPending}
            >
              Choose date
            </Button>
          </div>

          {mode === "custom" && (
            <DatePicker
              value={customDate}
              onChange={(date) => {
                setCustomDate(date ?? undefined);
                setMealChoice(NEW_MEAL_VALUE);
              }}
              placeholder="Select date"
              disabled={(date) => startOfDay(date) > startOfDay(new Date())}
            />
          )}

          {targetDateStr && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Add to meal</span>
              <Select
                value={resolvedMealChoice}
                onValueChange={setMealChoice}
                disabled={isPending}
              >
                <SelectTrigger className="w-full" aria-label="Target meal">
                  <SelectValue placeholder={isDayLoading ? "Loading meals…" : "Select meal"} />
                </SelectTrigger>
                <SelectContent className="w-(--radix-select-trigger-width)">
                  <SelectItem value={NEW_MEAL_VALUE}>New meal</SelectItem>
                  {mealsForTarget.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      Meal {m.meal_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleCopy} disabled={isCopyDisabled}>
            {isPending ? <Loader /> : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
