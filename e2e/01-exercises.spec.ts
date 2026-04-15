import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Exercises CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('creates category and two exercises of different unit types', async ({ page }) => {
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/exercises/categories') && r.status() === 200),
      page.goto('/exercises'),
    ])

    // Create category
    await page.getByPlaceholder('New category name').fill(TEST_NAMES.category)
    await page.getByRole('button', { name: /add category/i }).click()
    await expect(page.getByText(TEST_NAMES.category)).toBeVisible()

    // Expand the new category
    await page.getByTestId('exercise-category-item').filter({ hasText: TEST_NAMES.category }).click()

    // Add reps-based exercise
    const repsNameInput = page.getByPlaceholder('New exercise in this category')
    await repsNameInput.fill(TEST_NAMES.repsExercise)
    await page.getByRole('button', { name: /reps based/i }).click()
    await page.getByRole('button', { name: /add exercise/i }).click()
    await expect(page.getByText(TEST_NAMES.repsExercise)).toBeVisible()

    // Add time-based exercise (category should still be expanded)
    await repsNameInput.fill(TEST_NAMES.timeExercise)
    await page.getByRole('button', { name: /time based/i }).click()
    await page.getByRole('button', { name: /add exercise/i }).click()
    await expect(page.getByText(TEST_NAMES.timeExercise)).toBeVisible()
  })
})
