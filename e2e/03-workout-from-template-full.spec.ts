import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_NAMES } from './helpers/test-data'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create Workout A from template', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test('creates workout A from template with all sets checked', async ({ page }) => {
    await page.goto('/workout/create')

    // Select template
    await page.locator('#template-select').click()
    await page.getByPlaceholder('Search templates...').fill(TEST_NAMES.template)
    await page.getByRole('option', { name: TEST_NAMES.template }).first().click()

    // Wait for form to prefill with template data
    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).toHaveValue(TEST_NAMES.template)

    // Change workout name
    await nameInput.fill(TEST_NAMES.workoutA)

    // Check all 4 set checkboxes (isChecked — required for Records)
    // Order: ex1 set1, ex1 set2, ex2 set1, ex2 set2
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()
    await checkboxes.nth(2).click()
    await checkboxes.nth(3).click()

    // Save — wait for API response before navigating
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workouts/create-new-workout') && r.status() === 201),
      page.getByRole('button', { name: /save workout/i }).nth(1).click(),
    ])

    // Verify in history — search to bypass client-side pagination
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workouts/get-workouts-history') && r.status() === 200),
      page.goto('/main-page'),
    ])
    await page.getByPlaceholder('Search workouts...').fill(TEST_NAMES.workoutA)
    await page.waitForTimeout(300)
    await expect(page.getByText(TEST_NAMES.workoutA).first()).toBeVisible()
  })
})
