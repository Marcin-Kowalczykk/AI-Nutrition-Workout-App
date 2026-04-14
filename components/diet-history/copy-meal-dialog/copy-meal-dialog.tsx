"use client";

import { useState } from "react";
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
import { DatePicker } from "@/components/shared/date-picker";
import { Loader } from "@/components/shared/loader";

//hooks
import { useCopyMeal } from "../api/use-copy-meal";

//types
import type { IDietMeal } from "@/app/api/diet/types";

interface CopyMealDialogProps {
  meal: IDietMeal | null;
  onOpenChange: (open: boolean) => void;
}

export const CopyMealDialog = ({ meal, onOpenChange }: CopyMealDialogProps) => {
  const [mode, setMode] = useState<"today" | "custom">("today");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMode("today");
      setCustomDate(undefined);
    }
    onOpenChange(open);
  };

  const { mutate: copyMeal, isPending } = useCopyMeal({
    onSuccess: () => {
      toast.success("Meal copied");
      handleOpenChange(false);
    },
    onError: (err) => {
      toast.error(err || "Failed to copy meal");
    },
  });

  const handleCopy = () => {
    if (!meal) return;

    const targetDate =
      mode === "today"
        ? format(new Date(), "yyyy-MM-dd")
        : customDate
        ? format(customDate, "yyyy-MM-dd")
        : null;

    if (!targetDate) return;

    copyMeal({ meal_id: meal.id, target_date: targetDate });
  };

  const isCopyDisabled = isPending || (mode === "custom" && !customDate);

  return (
    <Dialog open={meal !== null} onOpenChange={handleOpenChange} preventOverlayClose={isPending}>
      <DialogContent
        isCloseButtonVisible={!isPending}
        className="sm:mx-2 max-w-sm rounded-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy meal
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
            onClick={handleCopy}
            disabled={isCopyDisabled}
          >
            {isPending ? <Loader /> : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
