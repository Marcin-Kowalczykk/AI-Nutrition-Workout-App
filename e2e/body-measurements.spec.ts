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
    await page.getByRole('button', { name: /dodaj/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByLabel(/waga/i).fill('75')
    await page.getByRole('button', { name: /zapisz/i }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
