import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Edit Workout A sets', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('changes reps of first set from 10 to 12 and saves', async ({ page }) => {
    await page.goto('/main-page')

    // Find Workout A card and click Edit
    const workoutCard = page.locator('li').filter({ hasText: TEST_NAMES.workoutA })
    await workoutCard.getByRole('button', { name: 'Edit workout' }).click()

    // Wait for form to hydrate
    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).toHaveValue(TEST_NAMES.workoutA)

    // Wait for set 1 reps to be populated
    const firstRepsInput = page.getByLabel(/^reps$/i).first()
    await expect(firstRepsInput).toHaveValue('10')

    // Update reps 10 → 12
    await firstRepsInput.fill('12')

    // Save and wait for API response
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workouts/update-workout') && (r.status() === 200 || r.status() === 204)),
      page.getByRole('button', { name: /update workout/i }).nth(1).click(),
    ])

    // Verify workout still appears in history
    await page.goto('/main-page')
    await expect(page.getByText(TEST_NAMES.workoutA)).toBeVisible()
  })
})
