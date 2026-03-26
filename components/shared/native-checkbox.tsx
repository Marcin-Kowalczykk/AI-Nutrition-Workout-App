"use client";

// libs
import { cn } from "@/lib/utils";

// components
import { Check } from "lucide-react";

interface NativeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const NativeCheckbox = ({
  checked,
  onChange,
  disabled,
  className,
}: NativeCheckboxProps) => (
  <label
    className={cn(
      "relative inline-flex h-5 w-5 shrink-0 cursor-pointer",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}
  >
    <input
      type="checkbox"
      tabIndex={-1}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="sr-only"
    />
    <div
      className={cn(
        "h-5 w-5 shrink-0 rounded-full border shadow-sm transition-colors flex items-center justify-center",
        checked
          ? "bg-success/10 border-success text-success"
          : "border-muted-foreground bg-transparent"
      )}
    >
      <Check className={cn("h-3 w-3", !checked && "invisible")} />
    </div>
  </label>
);
