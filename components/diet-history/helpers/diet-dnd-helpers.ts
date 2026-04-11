//types
import type { DietMealFormValues } from "../types";
import { DEFAULT_PRODUCT } from "../types";

//libs
import { arrayMove } from "@dnd-kit/sortable";

export const mergeMealsAtIndices = (
  meals: DietMealFormValues[],
  sourceMealIndex: number,
  targetMealIndex: number
): DietMealFormValues[] => {
  if (sourceMealIndex === targetMealIndex) return meals;
  const next = meals.map((m) => ({ ...m, products: [...m.products] }));
  const src = sourceMealIndex;
  const tgt = targetMealIndex;
  next[tgt] = {
    products: [...next[tgt].products, ...next[src].products],
  };
  next.splice(src, 1);
  return next;
};

export const applyProductDrop = (
  meals: DietMealFormValues[],
  fromMeal: number,
  fromProduct: number,
  toMeal: number,
  toProductIndex: number
): DietMealFormValues[] => {
  const copy = meals.map((m) => ({ ...m, products: [...m.products] }));

  if (fromMeal === toMeal) {
    copy[fromMeal] = {
      ...copy[fromMeal],
      products: arrayMove(copy[fromMeal].products, fromProduct, toProductIndex),
    };
    return copy;
  }

  const moving = copy[fromMeal].products[fromProduct];
  if (moving === undefined) return meals;

  copy[fromMeal].products.splice(fromProduct, 1);

  let destMealIdx = toMeal;
  let insertAt = toProductIndex;

  if (copy[fromMeal].products.length === 0) {
    if (copy.length > 1) {
      copy.splice(fromMeal, 1);
      if (fromMeal < destMealIdx) destMealIdx -= 1;
    } else {
      copy[fromMeal].products = [{ ...DEFAULT_PRODUCT }];
    }
  }

  insertAt = Math.min(Math.max(0, insertAt), copy[destMealIdx].products.length);
  copy[destMealIdx].products.splice(insertAt, 0, moving);
  return copy;
};
