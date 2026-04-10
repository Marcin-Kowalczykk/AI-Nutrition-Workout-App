import { cn } from "@/lib/utils";

type Macro = "protein" | "carbs" | "fat" | "kcal";

const MACRO_CONFIG: Record<Macro, { label: string; color: string; bg: string }> = {
  protein: { label: "P",    color: "text-macro-protein", bg: "bg-macro-protein" },
  carbs:   { label: "C",    color: "text-macro-carbs",   bg: "bg-macro-carbs" },
  fat:     { label: "F",    color: "text-macro-fat",     bg: "bg-macro-fat" },
  kcal:    { label: "kcal", color: "text-primary-element", bg: "bg-primary-element/10" },
};

interface MacroBadgeProps {
  macro: Macro;
  value: string | number;
  variant?: "badge" | "inline";
  className?: string;
}

export const MacroBadge = ({ macro, value, variant = "badge", className }: MacroBadgeProps) => {
  const { label, color, bg } = MACRO_CONFIG[macro];

  if (variant === "badge") {
    const content = macro === "kcal"
      ? `${value} kcal`
      : `${label} ${value}g`;

    return (
      <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded", bg, color, className)}>
        {content}
      </span>
    );
  }

  return (
    <span className={cn("font-medium", className)}>
      <span className={color}>{label}</span>
      <span className="text-muted-foreground">: {value}g</span>
    </span>
  );
};
