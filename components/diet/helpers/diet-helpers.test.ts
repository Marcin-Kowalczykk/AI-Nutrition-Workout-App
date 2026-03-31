import { describe, it, expect } from 'vitest'
import { buildDietDayPayload } from './build-diet-day-payload'
import { dietDayToFormValues } from './diet-day-to-form-values'
import type { IDietDay, IDietMeal, IDietProduct } from '@/app/api/diet/types'
import type { DietDayFormValues } from '../types'

// --- factory helpers ---

const makeProduct = (overrides: Partial<IDietProduct> = {}): IDietProduct => ({
  id: 'prod-1',
  diet_meal_id: 'meal-1',
  product_name: 'Chicken',
  product_kcal: 200,
  protein_value: 30,
  carbs_value: 0,
  fat_value: 5,
  weight_grams: null,
  kcal_per_100g: null,
  created_at: '2026-01-15T10:00:00.000Z',
  ...overrides,
})

const makeMeal = (overrides: Partial<IDietMeal> = {}): IDietMeal => ({
  id: 'meal-1',
  diet_day_id: 'day-1',
  meal_number: 1,
  created_at: '2026-01-15T10:00:00.000Z',
  diet_products: [makeProduct()],
  total_kcal: 200,
  ...overrides,
})

const makeDay = (overrides: Partial<IDietDay> = {}): IDietDay => ({
  id: 'day-1',
  user_id: 'user-1',
  date: '2026-01-15',
  created_at: '2026-01-15T10:00:00.000Z',
  updated_at: '2026-01-15T10:00:00.000Z',
  diet_meals: [makeMeal()],
  total_kcal: 200,
  total_protein_value: 30,
  total_carbs_value: 0,
  total_fat_value: 5,
  ...overrides,
})

const makeFormValues = (overrides: Partial<DietDayFormValues> = {}): DietDayFormValues => ({
  date: new Date('2026-01-15T00:00:00'),
  meals: [
    {
      products: [
        {
          product_name: 'Chicken',
          product_kcal: '200',
          protein_value: '30',
          carbs_value: '0',
          fat_value: '5',
        },
      ],
    },
  ],
  ...overrides,
})

// ----------------------------------------------------------------
describe('buildDietDayPayload', () => {
  it('formats date as YYYY-MM-DD using local date, not UTC', () => {
    // Local midnight (new Date('YYYY-MM-DDT00:00:00') has no timezone suffix → local time)
    // In UTC+1/+2 this would shift a day back via toISOString() — must use local getDate()
    const result = buildDietDayPayload(makeFormValues({ date: new Date('2026-03-15T00:00:00') }))
    expect(result.date).toBe('2026-03-15')
  })

  it('converts string macro values to numbers', () => {
    const result = buildDietDayPayload(makeFormValues())
    const product = result.meals[0].products[0]
    expect(product.product_kcal).toBe(200)
    expect(product.protein_value).toBe(30)
    expect(product.carbs_value).toBe(0)
    expect(product.fat_value).toBe(5)
    expect(typeof product.product_kcal).toBe('number')
  })

  it('preserves product name', () => {
    const result = buildDietDayPayload(makeFormValues())
    expect(result.meals[0].products[0].product_name).toBe('Chicken')
  })

  it('maps multiple meals and products', () => {
    const values = makeFormValues({
      meals: [
        {
          products: [
            { product_name: 'A', product_kcal: '100', protein_value: '10', carbs_value: '5', fat_value: '2' },
            { product_name: 'B', product_kcal: '50', protein_value: '5', carbs_value: '3', fat_value: '1' },
          ],
        },
        {
          products: [
            { product_name: 'C', product_kcal: '300', protein_value: '20', carbs_value: '40', fat_value: '8' },
          ],
        },
      ],
    })
    const result = buildDietDayPayload(values)
    expect(result.meals).toHaveLength(2)
    expect(result.meals[0].products).toHaveLength(2)
    expect(result.meals[1].products).toHaveLength(1)
    expect(result.meals[1].products[0].product_name).toBe('C')
  })

  it('converts decimal string values correctly', () => {
    const values = makeFormValues({
      meals: [
        {
          products: [
            { product_name: 'Rice', product_kcal: '130.5', protein_value: '2.7', carbs_value: '28.2', fat_value: '0.3' },
          ],
        },
      ],
    })
    const result = buildDietDayPayload(values)
    const product = result.meals[0].products[0]
    expect(product.product_kcal).toBeCloseTo(130.5)
    expect(product.protein_value).toBeCloseTo(2.7)
    expect(product.carbs_value).toBeCloseTo(28.2)
    expect(product.fat_value).toBeCloseTo(0.3)
  })
})

// ----------------------------------------------------------------
describe('dietDayToFormValues', () => {
  it('parses date string into a Date at midnight local time', () => {
    const result = dietDayToFormValues(makeDay({ date: '2026-03-15' }))
    expect(result.date).toBeInstanceOf(Date)
    expect(result.date.getFullYear()).toBe(2026)
    expect(result.date.getMonth()).toBe(2) // March = 2
    expect(result.date.getDate()).toBe(15)
    expect(result.date.getHours()).toBe(0)
    expect(result.date.getMinutes()).toBe(0)
  })

  it('converts number macro values to strings', () => {
    const result = dietDayToFormValues(makeDay())
    const product = result.meals[0].products[0]
    expect(product.product_kcal).toBe('200')
    expect(product.protein_value).toBe('30')
    expect(product.carbs_value).toBe('0')
    expect(product.fat_value).toBe('5')
    expect(typeof product.product_kcal).toBe('string')
  })

  it('preserves product name', () => {
    const result = dietDayToFormValues(makeDay())
    expect(result.meals[0].products[0].product_name).toBe('Chicken')
  })

  it('sorts meals by meal_number ascending', () => {
    const day = makeDay({
      diet_meals: [
        makeMeal({ id: 'meal-3', meal_number: 3, diet_products: [makeProduct({ id: 'p3', product_name: 'Dinner' })] }),
        makeMeal({ id: 'meal-1', meal_number: 1, diet_products: [makeProduct({ id: 'p1', product_name: 'Breakfast' })] }),
        makeMeal({ id: 'meal-2', meal_number: 2, diet_products: [makeProduct({ id: 'p2', product_name: 'Lunch' })] }),
      ],
    })
    const result = dietDayToFormValues(day)
    expect(result.meals[0].products[0].product_name).toBe('Breakfast')
    expect(result.meals[1].products[0].product_name).toBe('Lunch')
    expect(result.meals[2].products[0].product_name).toBe('Dinner')
  })

  it('maps multiple products within a meal', () => {
    const day = makeDay({
      diet_meals: [
        makeMeal({
          diet_products: [
            makeProduct({ id: 'p1', product_name: 'Oats', product_kcal: 150 }),
            makeProduct({ id: 'p2', product_name: 'Milk', product_kcal: 60 }),
          ],
        }),
      ],
    })
    const result = dietDayToFormValues(day)
    expect(result.meals[0].products).toHaveLength(2)
    expect(result.meals[0].products[0].product_name).toBe('Oats')
    expect(result.meals[0].products[1].product_name).toBe('Milk')
  })
})
