import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanResultFields } from "./scan-result-fields";
import type { ScanResult, ScanVariant } from "./scan-product.types";

const makeResult = (): ScanResult => ({
  kcal: "415",
  protein: "8.5",
  carbs: "52",
  fat: "18",
});

describe("ScanResultFields", () => {
  it("renders all 4 inputs disabled when no variant selected", () => {
    render(
      <ScanResultFields
        values={makeResult()}
        onChange={vi.fn()}
        variant={null}
      />
    );
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(4);
    inputs.forEach((input) => expect(input).toBeDisabled());
  });

  it("shows per-100g labels when per_100g variant selected", () => {
    render(
      <ScanResultFields
        values={makeResult()}
        onChange={vi.fn()}
        variant={"per_100g"}
      />
    );
    expect(screen.getByText("Kcal / 100g")).toBeInTheDocument();
    expect(screen.getByText("Protein / 100g")).toBeInTheDocument();
  });

  it("shows total labels when whole_product variant selected", () => {
    render(
      <ScanResultFields
        values={makeResult()}
        onChange={vi.fn()}
        variant={"whole_product"}
      />
    );
    expect(screen.getByText("Kcal total")).toBeInTheDocument();
    expect(screen.getByText("Protein total")).toBeInTheDocument();
  });

  it("inputs are enabled when a variant is selected", () => {
    render(
      <ScanResultFields
        values={makeResult()}
        onChange={vi.fn()}
        variant={"per_100g"}
      />
    );
    const inputs = screen.getAllByRole("spinbutton");
    inputs.forEach((input) => expect(input).not.toBeDisabled());
  });

  it("calls onChange when user edits a field", () => {
    const onChange = vi.fn();
    render(
      <ScanResultFields
        values={makeResult()}
        onChange={onChange}
        variant={"per_100g"}
      />
    );
    const kcalInput = screen.getAllByRole("spinbutton")[0];
    fireEvent.change(kcalInput, { target: { value: "420" } });
    expect(onChange).toHaveBeenCalledWith("kcal", "420");
  });

  it("shows per-100g labels as placeholder when no variant selected", () => {
    render(
      <ScanResultFields
        values={makeResult()}
        onChange={vi.fn()}
        variant={null}
      />
    );
    expect(screen.getByText("Kcal / 100g")).toBeInTheDocument();
  });
});
