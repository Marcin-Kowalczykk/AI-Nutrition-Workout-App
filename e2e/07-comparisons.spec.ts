import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Comparisons page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('shows both workouts for reps-based exercise', async ({ page }) => {
    await page.goto('/comparisons')

    // Select reps exercise (auto-opens to most popular; override by typing)
    await page.getByRole('combobox').first().click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.repsExercise)
    await page.getByRole('button', { name: TEST_NAMES.repsExercise }).click()

    // Both workouts should appear in history cards
    await expect(page.getByText(TEST_NAMES.workoutA).first()).toBeVisible()
    await expect(page.getByText(TEST_NAMES.workoutB).first()).toBeVisible()
  })

  test('shows both workouts for time-based exercise', async ({ page }) => {
    await page.goto('/comparisons')

    // Select time exercise and wait for history data to load
    await page.getByRole('combobox').first().click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.timeExercise)
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workouts/get-workouts-history') && r.status() === 200),
      page.getByRole('button', { name: TEST_NAMES.timeExercise }).click(),
    ])

    // Both workouts should appear
    await expect(page.getByText(TEST_NAMES.workoutA).first()).toBeVisible()
    await expect(page.getByText(TEST_NAMES.workoutB).first()).toBeVisible()
  })
})
