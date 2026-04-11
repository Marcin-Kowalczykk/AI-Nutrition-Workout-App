import { describe, it, expect } from "vitest";
import { applyProductDrop, mergeMealsAtIndices } from "./diet-dnd-helpers";
import { DEFAULT_PRODUCT } from "../types";
import type { DietMealFormValues, DietProductFormValues } from "../types";

const p = (name: string): DietProductFormValues => ({
  ...DEFAULT_PRODUCT,
  product_name: name,
  product_kcal: "1",
  protein_value: "0",
  carbs_value: "0",
  fat_value: "0",
});

describe("mergeMealsAtIndices", () => {
  it("appends source products after target (B then A)", () => {
    const meals: DietMealFormValues[] = [
      { products: [p("a1")] },
      { products: [p("b1"), p("b2")] },
    ];
    const out = mergeMealsAtIndices(meals, 0, 1);
    expect(out).toHaveLength(1);
    expect(out[0].products.map((x) => x.product_name)).toEqual(["b1", "b2", "a1"]);
  });

  it("merges when source meal index is greater than target", () => {
    const meals: DietMealFormValues[] = [
      { products: [p("b")] },
      { products: [p("a")] },
    ];
    const out = mergeMealsAtIndices(meals, 1, 0);
    expect(out).toHaveLength(1);
    expect(out[0].products.map((x) => x.product_name)).toEqual(["b", "a"]);
  });

  it("returns same reference when source equals target", () => {
    const meals: DietMealFormValues[] = [{ products: [p("x")] }];
    expect(mergeMealsAtIndices(meals, 0, 0)).toBe(meals);
  });
});

describe("applyProductDrop", () => {
  it("reorders within the same meal", () => {
    const meals: DietMealFormValues[] = [
      { products: [p("a"), p("b"), p("c")] },
    ];
    const out = applyProductDrop(meals, 0, 0, 0, 2);
    expect(out[0].products.map((x) => x.product_name)).toEqual(["b", "c", "a"]);
  });

  it("moves a product to another meal at a given index and drops empty source meal", () => {
    const meals: DietMealFormValues[] = [
      { products: [p("a")] },
      { products: [p("b"), p("c")] },
    ];
    const out = applyProductDrop(meals, 0, 0, 1, 1);
    expect(out).toHaveLength(1);
    expect(out[0].products.map((x) => x.product_name)).toEqual(["b", "a", "c"]);
  });

  it("moves a product to another meal and removes empty source meal when multiple meals", () => {
    const meals: DietMealFormValues[] = [
      { products: [p("only")] },
      { products: [p("b")] },
    ];
    const out = applyProductDrop(meals, 0, 0, 1, 0);
    expect(out).toHaveLength(1);
    expect(out[0].products.map((x) => x.product_name)).toEqual(["only", "b"]);
  });

  it("collapses to a single meal when the only product of the other meal is moved into it", () => {
    const meals: DietMealFormValues[] = [
      { products: [p("move")] },
      { products: [p("stay")] },
    ];
    const out = applyProductDrop(meals, 0, 0, 1, 0);
    expect(out).toHaveLength(1);
    expect(out[0].products.map((x) => x.product_name)).toEqual(["move", "stay"]);
  });
});
