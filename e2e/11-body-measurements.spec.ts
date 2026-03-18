import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Body measurements', () => {
  let createdMeasurementId: string | null = null

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test.afterEach(async ({ page }) => {
    if (createdMeasurementId) {
      await page.request.delete(`/api/body-measurements/delete?id=${createdMeasurementId}`)
      createdMeasurementId = null
    }
  })

  test('adds a new body measurement', async ({ page }) => {
    await page.goto('/body-measurements')
    await page.getByRole('button', { name: /add measurement/i }).first().click()

    await expect(page.getByRole('dialog')).toBeVisible()

    // Wait for both measurement queries to settle before filling
    // (the sheet triggers a second query; until it resolves, form.reset() can overwrite user input)
    await page.waitForLoadState('networkidle')
    const weightInput = page.locator('input[name="weight_kg"]')
    // Read the current default (from lastMeasurement) and use a different value to ensure isDirty=true
    const currentWeight = await weightInput.inputValue()
    const newWeight = String((parseFloat(currentWeight) || 0) + 1)
    await weightInput.fill(newWeight)

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/body-measurements/create') && r.status() === 201),
      page.getByRole('button', { name: /^save$/i }).click(),
    ])
    const data = await response.json()
    createdMeasurementId = data.id

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
