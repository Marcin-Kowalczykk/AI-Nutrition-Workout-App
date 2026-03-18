import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create workout', () => {
  let createdWorkoutName: string | null = null

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test.afterEach(async ({ page }) => {
    if (!createdWorkoutName) return
    const res = await page.request.get('/api/workouts/get-workouts-history?page_size=500')
    if (res.ok()) {
      const { workouts } = await res.json()
      const matching = workouts.filter((w: { name: string }) => w.name === createdWorkoutName)
      for (const w of matching) {
        await page.request.delete(`/api/workouts/delete-workout?id=${w.id}`)
      }
    }
    createdWorkoutName = null
  })

  test('creates a workout from scratch and it appears in history', async ({ page }) => {
    await page.goto('/workout/create')

    const workoutName = `Test workout ${Date.now()}`
    createdWorkoutName = workoutName
    await page.getByLabel(/workout name/i).fill(workoutName)

    await page.getByRole('button', { name: /save workout/i }).click()
    await expect(page).not.toHaveURL('/workout/create')

    await page.goto('/main-page')
    await expect(page.getByText(workoutName)).toBeVisible()
  })
})
