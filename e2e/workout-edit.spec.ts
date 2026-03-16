import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Edit workout from history', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('opens an existing workout in edit mode with form pre-populated', async ({ page }) => {
    await page.goto('/workout-history')

    const firstWorkout = page.getByRole('link', { name: /edytuj/i }).first()
    await firstWorkout.click()

    const nameInput = page.getByLabel(/nazwa treningu/i)
    await expect(nameInput).not.toBeEmpty()
  })

  test('saves edited workout and reflects changes in history', async ({ page }) => {
    await page.goto('/workout-history')

    const firstWorkout = page.getByRole('link', { name: /edytuj/i }).first()
    await firstWorkout.click()

    const nameInput = page.getByLabel(/nazwa treningu/i)
    const updatedName = `Edytowany trening ${Date.now()}`
    await nameInput.fill(updatedName)

    await page.getByRole('button', { name: /zapisz/i }).click()
    await expect(page).not.toHaveURL(/\/edit/)

    await page.goto('/workout-history')
    await expect(page.getByText(updatedName)).toBeVisible()
  })
})
