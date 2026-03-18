import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Cleanup test data', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('deletes template', async ({ page }) => {
    await page.goto('/workout/template')

    // Delete all matching templates (may be multiple from repeated test runs)
    let keepDeleting = true
    while (keepDeleting) {
      const templateCards = page.locator('li').filter({ hasText: TEST_NAMES.template })
      const count = await templateCards.count()
      if (count === 0) {
        keepDeleting = false
        break
      }
      await templateCards.first().getByRole('button', { name: 'Delete template' }).click()
      await page.getByRole('button', { name: 'Delete' }).click()
      // Wait for the modal to close and list to update
      await page.waitForTimeout(500)
    }

    await expect(page.locator('li').filter({ hasText: TEST_NAMES.template })).toHaveCount(0)
  })

  test('deletes Workout A', async ({ page }) => {
    await page.goto('/main-page')

    // Search first to handle pagination
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_NAMES.workoutA)
      await page.waitForTimeout(300)
    }

    const card = page.locator('li').filter({ hasText: TEST_NAMES.workoutA })
    const count = await card.count()
    if (count === 0) {
      // Already deleted, test passes
      return
    }

    await card.first().getByRole('button', { name: 'Delete workout' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('li').filter({ hasText: TEST_NAMES.workoutA })).toHaveCount(0, { timeout: 5000 })
  })

  test('deletes Workout B', async ({ page }) => {
    await page.goto('/main-page')

    // Search first to handle pagination
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_NAMES.workoutB)
      await page.waitForTimeout(300)
    }

    const card = page.locator('li').filter({ hasText: TEST_NAMES.workoutB })
    const count = await card.count()
    if (count === 0) {
      // Already deleted, test passes
      return
    }

    await card.first().getByRole('button', { name: 'Delete workout' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('li').filter({ hasText: TEST_NAMES.workoutB })).toHaveCount(0, { timeout: 5000 })
  })

  test('deletes category (and both exercises)', async ({ page }) => {
    await page.goto('/exercises')

    // Target the category header row directly by its CSS class + hasText
    const categoryHeaderRow = page
      .locator('div.flex.items-center.gap-2.p-3')
      .filter({ hasText: TEST_NAMES.category })

    const count = await categoryHeaderRow.count()
    if (count === 0) {
      // Category already deleted, test passes
      return
    }

    // The trash icon button is the only button in this row
    await categoryHeaderRow.first().getByRole('button').click()

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('div.flex.items-center.gap-2.p-3').filter({ hasText: TEST_NAMES.category })).toHaveCount(0, { timeout: 5000 })
    await expect(page.getByText(TEST_NAMES.repsExercise)).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(TEST_NAMES.timeExercise)).not.toBeVisible({ timeout: 5000 })
  })

  test('verifies exercises no longer appear in Records', async ({ page }) => {
    await page.goto('/records')
    await page.reload()

    await page.getByRole('button', { name: /open records filters/i }).click()
    await page.getByRole('combobox').click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.repsExercise)
    await expect(page.getByRole('button', { name: TEST_NAMES.repsExercise })).not.toBeVisible()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.timeExercise)
    await expect(page.getByRole('button', { name: TEST_NAMES.timeExercise })).not.toBeVisible()
  })

  test('verifies exercises no longer appear in Comparisons', async ({ page }) => {
    await page.goto('/comparisons')
    await page.reload()

    await page.getByRole('combobox').first().click()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.repsExercise)
    await expect(page.getByRole('button', { name: TEST_NAMES.repsExercise })).not.toBeVisible()
    await page.getByPlaceholder('Search exercises...').fill(TEST_NAMES.timeExercise)
    await expect(page.getByRole('button', { name: TEST_NAMES.timeExercise })).not.toBeVisible()
  })
})
