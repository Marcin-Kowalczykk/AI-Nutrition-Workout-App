import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

const closeFiltersSheet = async (page: import('@playwright/test').Page) => {
  const dialog = page.getByRole('dialog', { name: 'Records filters' })
  const closeBtn = dialog.getByRole('button', { name: 'Close' })
  await closeBtn.dispatchEvent('click')
  await expect(dialog).toBeHidden()
}

test.describe('Records page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('shows correct reps-based records', async ({ page }) => {
    await page.goto('/records')

    // Open filters and select reps exercise
    await page.getByRole('button', { name: /open records filters/i }).click()
    await page.getByRole('combobox').click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.repsExercise)
    await page.getByRole('button', { name: TEST_NAMES.repsExercise }).click()
    await closeFiltersSheet(page)

    // Wait for records to load
    await expect(page.getByText(/Reps record/i)).toBeVisible()

    // Verify max reps record (scoped to main content)
    await expect(page.locator('main').getByText('15 reps').first()).toBeVisible()

    // Ensure 8 reps checkbox is checked — only click if not already checked
    await page.getByRole('button', { name: /open records filters/i }).click()
    const repsCheckbox = page.getByRole('checkbox', { name: /8 reps/i })
    if (await repsCheckbox.getAttribute('data-state') !== 'checked') {
      await repsCheckbox.click()
    }
    await closeFiltersSheet(page)

    // Verify weight record for 8 reps
    await expect(page.locator('main').getByText('55 kg').first()).toBeVisible()
  })

  test('shows correct time-based records', async ({ page }) => {
    await page.goto('/records')

    // Open filters and select time exercise
    await page.getByRole('button', { name: /open records filters/i }).click()
    await page.getByRole('combobox').click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.timeExercise)
    await page.getByRole('button', { name: TEST_NAMES.timeExercise }).click()
    await closeFiltersSheet(page)

    // Wait for records to load
    await expect(page.getByText(/Time record/i)).toBeVisible()

    // Verify max duration
    await expect(page.locator('main').getByText('60 s').first()).toBeVisible()

    // Ensure 12 kg checkbox is checked — only click if not already checked
    await page.getByRole('button', { name: /open records filters/i }).click()
    const kgCheckbox = page.getByRole('checkbox', { name: /12 kg/i })
    if (await kgCheckbox.getAttribute('data-state') !== 'checked') {
      await kgCheckbox.click()
    }
    await closeFiltersSheet(page)

    // Verify duration record for 12 kg weight
    await expect(page.locator('main').getByText('30 s').first()).toBeVisible()
  })
})
