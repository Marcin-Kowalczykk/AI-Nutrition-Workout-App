import { test, expect } from '@playwright/test'
import path from 'path'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Diet scan product', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)

    // Clean up any leftover diet entries from the last 7 days
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    const historyRes = await page.request.get(
      `/api/diet/get-history?start_date=${start.toISOString()}&end_date=${end.toISOString()}`
    )
    if (historyRes.ok()) {
      const { days } = await historyRes.json()
      for (const day of days ?? []) {
        await page.request.delete(`/api/diet/delete?id=${day.id}`)
      }
    }
  })

  test('fills calculator fields after scanning a nutrition label', async ({ page }) => {
    // Mock the scan-product API to return fixed values
    await page.route('**/api/diet/scan-product', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kcal_per_100g: 165,
          protein_per_100g: 31,
          carbs_per_100g: 0,
          fat_per_100g: 3.6,
        }),
      })
    })

    await page.goto('/diet-history')
    await page.waitForResponse(r => r.url().includes('/api/diet/get-history') && r.status() === 200)
    await page.getByRole('button', { name: /add diet day/i }).click()
    await expect(page.getByRole('dialog').first()).toBeVisible()

    // Open the calculator section
    await page.getByRole('button', { name: /calculate from 100g/i }).click()

    // Click "Open camera" — triggers the scan dialog
    await page.getByRole('button', { name: /open camera/i }).click()

    // ProductScannerDialog should open
    const scanDialog = page.getByRole('dialog', { name: /scan product/i })
    await expect(scanDialog).toBeVisible()

    // Set the test image on the hidden file input
    const fileChooserPromise = page.waitForEvent('filechooser')
    await scanDialog.getByRole('button', { name: /take photo/i }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(path.join(__dirname, 'fixtures/test-label.jpg'))

    // Preview should appear with Analyze button
    await expect(scanDialog.getByRole('button', { name: /^analyze$/i })).toBeVisible()
    await scanDialog.getByRole('button', { name: /^analyze$/i }).click()

    // Result state: editable fields with AI values
    await expect(scanDialog.getByRole('button', { name: /apply to calculator/i })).toBeVisible()

    // Apply — fills calculator fields and closes dialog
    await scanDialog.getByRole('button', { name: /apply to calculator/i }).click()
    await expect(scanDialog).not.toBeVisible()

    // Verify calculator fields are filled
    // Calculator uses plain <label> tags (not FormLabel) — locate input via parent div
    const kcalPer100gInput = page.locator('label', { hasText: 'Kcal / 100g' }).locator('..').locator('input')
    const proteinPer100gInput = page.locator('label', { hasText: 'Protein / 100g' }).locator('..').locator('input')
    const carbsPer100gInput = page.locator('label', { hasText: 'Carbs / 100g' }).locator('..').locator('input')
    const fatPer100gInput = page.locator('label', { hasText: 'Fat / 100g' }).locator('..').locator('input')
    await expect(kcalPer100gInput).toHaveValue('165')
    await expect(proteinPer100gInput).toHaveValue('31')
    await expect(carbsPer100gInput).toHaveValue('0')
    await expect(fatPer100gInput).toHaveValue('3.6')
  })
})
