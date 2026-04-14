import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanVariantTiles } from "./scan-variant-tiles";
import type { ScanApiResponse } from "./scan-product.types";

const makeApiResult = (): ScanApiResponse => ({
  kcal_per_100g: 415,
  protein_per_100g: 8.5,
  carbs_per_100g: 52,
  fat_per_100g: 18,
  whole_product: { grams: 200, kcal: 830, protein: 17, carbs: 104, fat: 36 },
  total_grams: 200,
});

describe("ScanVariantTiles", () => {
  it("renders both tiles", () => {
    render(<ScanVariantTiles apiResult={makeApiResult()} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Per 100g")).toBeInTheDocument();
    expect(screen.getByText("Whole product")).toBeInTheDocument();
  });

  it("calls onSelect with per_100g when first tile clicked", () => {
    const onSelect = vi.fn();
    render(<ScanVariantTiles apiResult={makeApiResult()} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Per 100g").closest("[data-variant]")!);
    expect(onSelect).toHaveBeenCalledWith("per_100g");
  });

  it("calls onSelect with whole_product when second tile clicked", () => {
    const onSelect = vi.fn();
    render(<ScanVariantTiles apiResult={makeApiResult()} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Whole product").closest("[data-variant]")!);
    expect(onSelect).toHaveBeenCalledWith("whole_product");
  });

  it("shows grams pill on whole_product tile", () => {
    render(<ScanVariantTiles apiResult={makeApiResult()} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("200g")).toBeInTheDocument();
  });

  it("shows checkmark on selected tile", () => {
    render(<ScanVariantTiles apiResult={makeApiResult()} selected="per_100g" onSelect={vi.fn()} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });
});
