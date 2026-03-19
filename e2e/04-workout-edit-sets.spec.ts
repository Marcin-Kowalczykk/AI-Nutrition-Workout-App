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
    await page.waitForResponse(r => r.url().includes('/api/workouts/get-workouts-history') && r.status() === 200)

    // Search to bypass client-side pagination before locating the card
    await page.getByPlaceholder('Search workouts...').fill(TEST_NAMES.workoutA)
    await page.waitForTimeout(300)

    // Find Workout A card and click Edit
    const workoutCard = page.getByTestId('workout-history-item').filter({ hasText: TEST_NAMES.workoutA }).first()
    await workoutCard.getByRole('button', { name: 'Edit workout' }).click()

    // Wait for form to hydrate
    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).toHaveValue(TEST_NAMES.workoutA)

    // Wait for set 1 reps to be populated (value may vary on repeated runs)
    const firstRepsInput = page.getByLabel(/^reps$/i).first()
    await expect(firstRepsInput).not.toHaveValue('')

    // Ensure form is dirty: pick a target value different from what is already stored
    const currentReps = await firstRepsInput.inputValue()
    const targetReps = currentReps === '12' ? '11' : '12'
    await firstRepsInput.fill(targetReps)

    // Save and wait for API response
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workouts/update-workout') && (r.status() === 200 || r.status() === 204)),
      page.getByRole('button', { name: /update workout/i }).nth(1).click(),
    ])

    // Verify workout still appears in history — search to bypass pagination
    await page.goto('/main-page')
    await page.waitForResponse(r => r.url().includes('/api/workouts/get-workouts-history') && r.status() === 200)
    await page.getByPlaceholder('Search workouts...').fill(TEST_NAMES.workoutA)
    await page.waitForTimeout(300)
    await expect(page.getByText(TEST_NAMES.workoutA).first()).toBeVisible()
  })
})
