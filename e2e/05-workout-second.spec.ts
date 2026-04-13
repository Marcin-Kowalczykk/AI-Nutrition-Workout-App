import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create Workout B (records baseline)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('creates workout B with higher values to set records', async ({ page }) => {
    await page.goto('/workout/create')

    // Select template
    await page.locator('#template-select').click()
    await page.getByPlaceholder('Search templates...').fill(TEST_NAMES.template)
    await page.getByRole('option', { name: TEST_NAMES.template }).first().click()

    // Wait for prefill
    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).toHaveValue(TEST_NAMES.template)

    // Change workout name
    await nameInput.fill(TEST_NAMES.workoutB)

    // === Overwrite set values ===

    // Reps-based exercise:
    // Set 1: reps 15 (beats Workout A set 1 = 12 after edit)
    await page.getByLabel('Reps').nth(0).fill('15')
    // Set 2: reps 8, weight 55 (beats Workout A set 2 weight = 50)
    await page.getByLabel('Reps').nth(1).fill('8')
    await page.getByLabel('Weight kg').nth(1).fill('55')

    // Time-based exercise:
    // Set 1: duration 60 (beats Workout A set 1 = 45 s), no weight
    await page.getByLabel('Duration s').nth(0).fill('60')
    // Set 2: duration 30, weight 12 (beats Workout A set 2 weight = 10)
    await page.getByLabel('Duration s').nth(1).fill('30')
    await page.getByLabel('Weight kg').nth(3).fill('12')

    // Check all 4 set checkboxes
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()
    await checkboxes.nth(2).click()
    await checkboxes.nth(3).click()

    // Save — wait for API response before navigating
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workouts/create-new-workout') && r.status() === 201),
      page.getByRole('button', { name: /save workout/i }).nth(1).click(),
    ])
  })
})
