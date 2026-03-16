import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Unsaved changes guard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('shows confirm modal when navigating away with unsaved changes', async ({ page }) => {
    await page.goto('/workout/create')
    await page.getByLabel(/nazwa treningu/i).fill('Nowy trening')
    await page.getByRole('link', { name: /historia/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('does not show modal when navigating away without changes', async ({ page }) => {
    await page.goto('/workout/create')
    await page.getByRole('link', { name: /historia/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
