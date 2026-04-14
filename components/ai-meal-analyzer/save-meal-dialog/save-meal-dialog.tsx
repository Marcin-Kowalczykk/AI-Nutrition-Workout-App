"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { UtensilsCrossed } from "lucide-react";

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
import { DatePicker } from "@/components/shared/date-picker";
import { Loader } from "@/components/shared/loader";

//hooks
import { useAddMeal } from "../api/use-add-meal";

//types
import type { ProductAnalysis } from "@/components/shared/diet/ai-meal-analyzer";

interface SaveMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductAnalysis[];
  onSuccess: () => void;
}

export const SaveMealDialog = ({
  open,
  onOpenChange,
  products,
  onSuccess,
}: SaveMealDialogProps) => {
  const [mode, setMode] = useState<"today" | "custom">("today");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMode("today");
      setCustomDate(undefined);
    }
    onOpenChange(isOpen);
  };

  const { mutate: addMeal, isPending } = useAddMeal({
    onSuccess: () => {
      toast.success("Meal saved");
      handleOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err || "Failed to save meal");
    },
  });

  const handleSave = () => {
    const targetDate =
      mode === "today"
        ? format(new Date(), "yyyy-MM-dd")
        : customDate
        ? format(customDate, "yyyy-MM-dd")
        : null;

    if (!targetDate) return;

    addMeal({ products, target_date: targetDate });
  };

  const isSaveDisabled = isPending || (mode === "custom" && !customDate);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} preventOverlayClose={isPending}>
      <DialogContent
        isCloseButtonVisible={!isPending}
        className="sm:mx-2 max-w-sm rounded-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Add new meal
          </DialogTitle>
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
              }}
              disabled={isPending}
            >
              Today
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("custom")}
              disabled={isPending}
            >
              Choose date
            </Button>
          </div>

          {mode === "custom" && (
            <DatePicker
              value={customDate}
              onChange={(date) => setCustomDate(date ?? undefined)}
              placeholder="Select date"
              disabled={(date) => startOfDay(date) > startOfDay(new Date())}
            />
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
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {isPending ? <Loader /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
