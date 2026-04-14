"use client";

//types
import type { ScanApiResponse, ScanVariant } from "./scan-product.types";

interface ScanVariantTilesProps {
  apiResult: ScanApiResponse;
  selected: ScanVariant | null;
  onSelect: (variant: ScanVariant) => void;
}

type MacroType = "protein" | "carbs" | "fat";

interface MacroRowProps {
  label: string;
  value: number | null;
  macro: MacroType;
}

const macroColorMap: Record<MacroType, string> = {
  protein: "text-macro-protein",
  carbs: "text-macro-carbs",
  fat: "text-macro-fat",
};

const MacroRow = ({ label, value, macro }: MacroRowProps) => (
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>{label}</span>
    <span className={`font-medium ${macroColorMap[macro]}`}>
      {value != null ? `${value}g` : "—"}
    </span>
  </div>
);

export const ScanVariantTiles = ({
  apiResult,
  selected,
  onSelect,
}: ScanVariantTilesProps) => {
  const wp = apiResult.whole_product;
  if (!wp) return null;

  const tileBase =
    "relative flex flex-col gap-1 rounded-xl border p-3 cursor-pointer transition-colors";
  const selectedStyle = "border-primary-element bg-primary-element/5";
  const unselectedStyle = "border-border hover:border-primary-element/50";

  return (
    <div className="grid grid-cols-2 gap-2">
      <div
        data-variant="per_100g"
        className={`${tileBase} ${
          selected === "per_100g" ? selectedStyle : unselectedStyle
        }`}
        onClick={() => onSelect("per_100g")}
      >
        {selected === "per_100g" && (
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-element text-[9px] font-bold text-white">
            ✓
          </span>
        )}
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          Per 100g
        </p>
        <p className="text-lg font-bold leading-none">
          {apiResult.kcal_per_100g ?? "—"}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            kcal
          </span>
        </p>
        <div className="mt-1 flex flex-col gap-0.5">
          <MacroRow label="Protein" value={apiResult.protein_per_100g} macro="protein" />
          <MacroRow label="Carbs" value={apiResult.carbs_per_100g} macro="carbs" />
          <MacroRow label="Fat" value={apiResult.fat_per_100g} macro="fat" />
        </div>
        <span className="mt-2 inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
          100g
        </span>
      </div>

      <div
        data-variant="whole_product"
        className={`${tileBase} ${
          selected === "whole_product" ? selectedStyle : unselectedStyle
        }`}
        onClick={() => onSelect("whole_product")}
      >
        {selected === "whole_product" && (
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-element text-[9px] font-bold text-white">
            ✓
          </span>
        )}
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          Whole product
        </p>
        <p className="text-lg font-bold leading-none">
          {wp.kcal}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            kcal
          </span>
        </p>
        <div className="mt-1 flex flex-col gap-0.5">
          <MacroRow label="Protein" value={wp.protein} macro="protein" />
          <MacroRow label="Carbs" value={wp.carbs} macro="carbs" />
          <MacroRow label="Fat" value={wp.fat} macro="fat" />
        </div>
        <span className="mt-2 inline-block rounded-full border border-primary-element/30 bg-primary-element/10 px-2 py-0.5 text-[9px] font-semibold text-primary-element">
          {wp.grams}g
        </span>
      </div>
    </div>
  );
};
