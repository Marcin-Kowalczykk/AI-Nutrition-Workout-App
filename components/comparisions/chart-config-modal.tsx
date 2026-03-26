"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExerciseUnitType } from "@/app/api/exercises/types";

type ChartMode = "reps_weight" | "reps_only" | "duration_weight";

export interface ChartConfigState {
  mode: ChartMode;
  repsTarget: string;
  weightTarget: string;
  bodyweightOnly: boolean;
}

interface ChartConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitType?: ExerciseUnitType;
  value: ChartConfigState | null;
  onSave: (value: ChartConfigState) => void;
}

const getDefaultConfig = (unitType?: ExerciseUnitType): ChartConfigState => {
  if (unitType === "time-based") {
    return {
      mode: "duration_weight",
      repsTarget: "",
      weightTarget: "",
      bodyweightOnly: true,
    };
  }

  return {
    mode: "reps_weight",
    repsTarget: "",
    weightTarget: "",
    bodyweightOnly: false,
  };
};

export const ChartConfigModal = ({
  open,
  onOpenChange,
  unitType,
  value,
  onSave,
}: ChartConfigModalProps) => {
  const [draft, setDraft] = useState<ChartConfigState>(
    value ?? getDefaultConfig(unitType)
  );

  const isTimeBased = unitType === "time-based";

  const handleConfirm = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-2 max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-base"></DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {!isTimeBased && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Mode
              </span>
              <RadioGroup
                value={draft.mode}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    mode: value as ChartMode,
                  }))
                }
                className="flex flex-row flex-wrap gap-4"
              >
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="reps_weight" />
                  <span>Weight over time</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="reps_only" />
                  <span>Reps over time</span>
                </label>
              </RadioGroup>
            </div>
          )}

          {!isTimeBased && draft.mode === "reps_weight" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Reps
                </label>
                <Input
                  type="number"
                  min={0}
                  value={draft.repsTarget}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      repsTarget: e.target.value,
                    }))
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The chart will show how your max weight for this number of reps
                changes over time.
              </p>
            </>
          )}

          {!isTimeBased && draft.mode === "reps_only" && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                The chart will show how your max reps change over time. (only sets without additional weight will be included)
              </p>
            </div>
          )}

          {isTimeBased && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Mode
                </span>
                <RadioGroup
                  value={draft.bodyweightOnly ? "bodyweight" : "weighted"}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      bodyweightOnly: value === "bodyweight",
                      weightTarget:
                        value === "bodyweight" ? "" : prev.weightTarget,
                    }))
                  }
                  className="flex flex-row flex-wrap gap-4"
                >
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                    <RadioGroupItem value="bodyweight" />
                    <span>Bodyweight only</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                    <RadioGroupItem value="weighted" />
                    <span>With additional weight</span>
                  </label>
                </RadioGroup>
              </div>

              {!draft.bodyweightOnly && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Weight [kg]
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={draft.weightTarget}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        weightTarget: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <p className="text-[10.5px] text-muted-foreground">
                  The chart will show how your duration changes over time.
                </p>
                <p className="text-[10.5px] text-muted-foreground">
                  You can focus on bodyweight sets or add a specific additional
                  weight.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
