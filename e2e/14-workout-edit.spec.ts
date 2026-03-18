import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

const TEST_WORKOUT_NAME = 'E2E Edit Test Workout'

test.describe('Edit workout from history', () => {
  let workoutId: string | null = null

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    const res = await page.request.post('/api/workouts/create-new-workout', {
      data: { name: TEST_WORKOUT_NAME, exercises: [] },
    })
    const data = await res.json()
    workoutId = data.id
  })

  test.afterEach(async ({ page }) => {
    if (workoutId) {
      await page.request.delete(`/api/workouts/delete-workout?id=${workoutId}`)
      workoutId = null
    }
  })

  test('opens an existing workout in edit mode with form pre-populated', async ({ page }) => {
    await page.goto(`/workout/edit?id=${workoutId}`)

    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).not.toBeEmpty()
  })

  test('saves edited workout and reflects changes in history', async ({ page }) => {
    await page.goto(`/workout/edit?id=${workoutId}`)

    const nameInput = page.getByLabel(/workout name/i)
    // Wait for form to hydrate — the workout fetch must complete before we edit
    await expect(nameInput).toHaveValue(TEST_WORKOUT_NAME)

    const updatedName = `Edited workout ${Date.now()}`
    await nameInput.fill(updatedName)
    // Verify fill persisted — guards against form.reset() overwriting our input
    await expect(nameInput).toHaveValue(updatedName)

    // Only one "Update Workout" button exists when exercises: [] — no per-exercise buttons
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/workouts/update-workout') && (resp.status() === 200 || resp.status() === 204)),
      page.getByRole('button', { name: /update workout/i }).first().click(),
    ])
    // Edit form stays on /workout/edit after update; navigate to history to verify
    await page.goto('/main-page')
    await page.waitForResponse(r => r.url().includes('/api/workouts/get-workouts-history') && r.status() === 200)
    await expect(page.getByText(updatedName)).toBeVisible()
  })
})
