import { Page } from '@playwright/test'

export const loginAs = async (page: Page, email: string, password: string) => {
  await page.goto('/login')
  await page.getByLabel(/e-mail/i).fill(email)
  await page.getByLabel(/hasło/i).fill(password)
  await page.getByRole('button', { name: /zaloguj/i }).click()
  await page.waitForURL('/')
}
