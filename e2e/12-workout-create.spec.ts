import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create workout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('creates a workout from scratch and it appears in history', async ({ page }) => {
    await page.goto('/workout/create')

    const workoutName = `Test workout ${Date.now()}`
    await page.getByLabel(/workout name/i).fill(workoutName)

    await page.getByRole('button', { name: /save workout/i }).click()
    await expect(page).not.toHaveURL('/workout/create')

    await page.goto('/main-page')
    await expect(page.getByText(workoutName)).toBeVisible()
  })
})
