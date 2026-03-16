import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Body measurements', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('adds a new body measurement', async ({ page }) => {
    await page.goto('/body-measurements')
    await page.getByRole('button', { name: /add measurement/i }).first().click()

    await expect(page.getByRole('dialog')).toBeVisible()

    // Wait for both measurement queries to settle before filling
    // (the sheet triggers a second query; until it resolves, form.reset() can overwrite user input)
    await page.waitForLoadState('networkidle')
    const weightInput = page.locator('input[name="weight_kg"]')
    await weightInput.fill('75')
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
