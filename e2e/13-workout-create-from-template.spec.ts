import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create workout from template', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('pre-fills workout form when a template is selected from the dropdown', async ({ page }) => {
    await page.goto('/workout/create')

    await page.locator('#template-select').click()

    const firstOption = page.getByRole('option').first()
    await expect(firstOption).toBeVisible()
    await firstOption.click()

    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).not.toBeEmpty()
  })
})
