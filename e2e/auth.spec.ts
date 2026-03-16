import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Authentication', () => {
  test('logs in with valid credentials', async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await expect(page).toHaveURL('/')
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-mail/i).fill(EMAIL)
    await page.getByLabel(/hasło/i).fill('wrong-password-123')
    await page.getByRole('button', { name: /zaloguj/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
