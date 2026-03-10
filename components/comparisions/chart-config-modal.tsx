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
          <DialogTitle className="text-base">
            Configure chart for this exercise
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {!isTimeBased && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Mode
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={draft.mode === "reps_weight" ? "default" : "outline"}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, mode: "reps_weight" }))
                  }
                >
                  Weight over time
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={draft.mode === "reps_only" ? "default" : "outline"}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, mode: "reps_only" }))
                  }
                >
                  Reps over time
                </Button>
              </div>
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
                  placeholder="-"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The chart will show how your max weight [kg] for this number of
                reps changes over time.
              </p>
            </>
          )}

          {!isTimeBased && draft.mode === "reps_only" && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                The chart will show how your max reps (with weight = 0) change
                over time.
              </p>
            </div>
          )}

          {isTimeBased && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Mode
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={draft.bodyweightOnly ? "default" : "outline"}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        bodyweightOnly: true,
                        weightTarget: "",
                      }))
                    }
                  >
                    Bodyweight only
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!draft.bodyweightOnly ? "default" : "outline"}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        bodyweightOnly: false,
                      }))
                    }
                  >
                    With additional weight
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] text-muted-foreground">
                  The chart will show how your duration changes over time.
                </p>
                <p className="text-[10px] text-muted-foreground">
                  You can focus on bodyweight sets or add a specific additional
                  weight.
                </p>
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
                    placeholder="-"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
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
