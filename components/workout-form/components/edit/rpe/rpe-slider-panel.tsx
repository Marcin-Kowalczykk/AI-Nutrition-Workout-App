"use client";

// dependencies
import { X } from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface RpeSliderPanelProps {
  rpeValue: number | null | undefined;
  displayValue: number;
  isPending: boolean;
  onValueChange: (value: number) => void;
  onClear: () => void;
}

export const RpeSliderPanel = ({
  rpeValue,
  displayValue,
  isPending,
  onValueChange,
  onClear,
}: RpeSliderPanelProps) => (
  <div className="flex items-center gap-1 py-2">
    <span className="text-sm text-muted-foreground w-14 shrink-0">
      RPE: {rpeValue != null ? rpeValue : "—"}
    </span>
    <Slider
      value={[displayValue]}
      min={1}
      max={10}
      step={1}
      className="flex-1 rpe-slider"
      onValueChange={([val]) => onValueChange(val)}
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClear}
      disabled={isPending}
      className="shrink-0 size-6 text-muted-foreground hover:text-destructive"
    >
      <X className="size-3.5" />
    </Button>
  </div>
);
