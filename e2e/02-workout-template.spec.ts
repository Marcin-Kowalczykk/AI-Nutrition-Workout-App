import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Workout template creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('creates template with reps-based and time-based exercises', async ({ page }) => {
    await page.goto('/workout/template/create')

    // Fill template name
    await page.getByLabel(/template name/i).fill(TEST_NAMES.template)

    // === Exercise 1: reps-based ===
    await page.getByRole('button', { name: /add exercise/i }).click()

    // Select exercise from ExercisesSelect (combobox → search → pick button)
    await page.getByRole('combobox').nth(0).click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.repsExercise)
    await page.getByRole('button', { name: TEST_NAMES.repsExercise }).click()

    // Set 1 — reps only
    await page.getByRole('button', { name: /add set/i }).nth(0).click()
    await page.getByLabel('Reps').nth(0).fill('10')

    // Set 2 — reps + weight
    await page.getByRole('button', { name: /add set/i }).nth(0).click()
    await page.getByLabel('Reps').nth(1).fill('8')
    await page.getByLabel('Weight [kg]').nth(1).fill('50')

    // === Exercise 2: time-based ===
    await page.getByRole('button', { name: /add exercise/i }).click()

    // Select time-based exercise (now 2 comboboxes, use nth(1))
    await page.getByRole('combobox').nth(1).click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.timeExercise)
    await page.getByRole('button', { name: TEST_NAMES.timeExercise }).click()

    // Set 1 — duration only
    await page.getByRole('button', { name: /add set/i }).nth(1).click()
    await page.getByLabel('Duration [s]').nth(0).fill('45')

    // Set 2 — duration + weight
    await page.getByRole('button', { name: /add set/i }).nth(1).click()
    await page.getByLabel('Duration [s]').nth(1).fill('30')
    await page.getByLabel('Weight [kg]').nth(3).fill('10')

    // Save — wait for API response before navigating away
    // There are two "Save Template" buttons; use the submit button (nth(1))
    // The create endpoint returns 201
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workout-templates/create') && r.status() === 201),
      page.getByRole('button', { name: /save template/i }).nth(1).click(),
    ])

    // Verify template in list
    await page.goto('/workout/template')
    await expect(page.getByText(TEST_NAMES.template).first()).toBeVisible()
  })
})
