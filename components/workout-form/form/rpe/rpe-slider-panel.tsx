"use client";

//libs
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

//components
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface RpeSliderPanelProps {
  rpeValue: number | null | undefined;
  displayValue: number;
  isPending: boolean;
  onValueChange: (value: number) => void;
  onClear: () => void;
}

const RPE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const RpeSliderPanel = ({
  rpeValue,
  displayValue,
  isPending,
  onValueChange,
  onClear,
}: RpeSliderPanelProps) => (
  <div className="mt-1 rounded-lg border border-border bg-muted px-3 py-2">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        RPE
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-black text-primary-element">
          {rpeValue != null ? rpeValue : "—"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isPending}
          className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
    <Slider
      value={[displayValue]}
      min={1}
      max={10}
      step={1}
      className="rpe-slider"
      onValueChange={([val]) => onValueChange(val)}
    />
    <div className="mt-1.5 flex justify-between px-0.5">
      {RPE_STEPS.map((n) => (
        <span
          key={n}
          className={cn(
            "text-[8px] font-bold leading-none",
            n === displayValue
              ? "text-primary-element"
              : "text-muted-foreground/40"
          )}
        >
          {n}
        </span>
      ))}
    </div>
  </div>
);
