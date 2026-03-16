import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create workout from template', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('creates a workout from an existing template and it appears in history', async ({ page }) => {
    await page.goto('/workout-templates')

    const useTemplateButton = page.getByRole('button', { name: /użyj/i }).first()
    await useTemplateButton.click()

    await expect(page).toHaveURL(/\/workout\/create/)

    await page.getByRole('button', { name: /zapisz/i }).click()
    await expect(page).not.toHaveURL(/\/workout\/create/)
  })
})
