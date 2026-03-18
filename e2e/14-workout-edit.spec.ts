import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Edit workout from history', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('opens an existing workout in edit mode with form pre-populated', async ({ page }) => {
    await page.goto('/main-page')

    const firstEditButton = page.getByRole('button', { name: /edit workout/i }).first()
    await firstEditButton.click()

    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).not.toBeEmpty()
  })

  test('saves edited workout and reflects changes in history', async ({ page }) => {
    await page.goto('/main-page')

    const firstEditButton = page.getByRole('button', { name: /edit workout/i }).first()
    await firstEditButton.click()

    const nameInput = page.getByLabel(/workout name/i)
    const updatedName = `Edited workout ${Date.now()}`
    await nameInput.fill(updatedName)

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/workouts') && resp.status() === 200),
      page.getByRole('button', { name: /update workout/i }).click(),
    ])
    // Edit form stays on /workout/edit after update; navigate to history to verify
    await page.goto('/main-page')
    await expect(page.getByText(updatedName)).toBeVisible()
  })
})
