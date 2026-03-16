import { Page } from '@playwright/test'

export const loginAs = async (page: Page, email: string, password: string) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /login/i }).click()
  await page.waitForURL('/main-page')
}
