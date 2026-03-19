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
    // Fetch all templates via API and delete matching ones
    const res = await page.request.get('/api/workout-templates/list')
    if (res.ok()) {
      const { templates } = await res.json()
      const matching = templates.filter((t: { name: string }) =>
        t.name === TEST_NAMES.template
      )
      for (const t of matching) {
        await page.request.delete(`/api/workout-templates/delete?id=${t.id}`)
      }
    }

    // Verify gone from UI
    await page.goto('/workout/template')
    await expect(page.getByTestId('workout-template-item').filter({ hasText: TEST_NAMES.template })).toHaveCount(0)
  })

  test('deletes Workout A', async ({ page }) => {
    // Fetch full workout history and delete all matching Workout A entries
    const res = await page.request.get('/api/workouts/get-workouts-history?page_size=500')
    if (res.ok()) {
      const { workouts } = await res.json()
      const matching = workouts.filter((w: { name: string }) =>
        w.name === TEST_NAMES.workoutA
      )
      for (const w of matching) {
        await page.request.delete(`/api/workouts/delete-workout?id=${w.id}`)
      }
    }

    // Verify gone from UI (search to narrow scope)
    await page.goto('/main-page')
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_NAMES.workoutA)
      await page.waitForTimeout(300)
    }
    await expect(page.getByTestId('workout-history-item').filter({ hasText: TEST_NAMES.workoutA })).toHaveCount(0)
  })

  test('deletes Workout B', async ({ page }) => {
    // Fetch full workout history and delete all matching Workout B entries
    const res = await page.request.get('/api/workouts/get-workouts-history?page_size=500')
    if (res.ok()) {
      const { workouts } = await res.json()
      const matching = workouts.filter((w: { name: string }) =>
        w.name === TEST_NAMES.workoutB
      )
      for (const w of matching) {
        await page.request.delete(`/api/workouts/delete-workout?id=${w.id}`)
      }
    }

    // Verify gone from UI (search to narrow scope)
    await page.goto('/main-page')
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_NAMES.workoutB)
      await page.waitForTimeout(300)
    }
    await expect(page.getByTestId('workout-history-item').filter({ hasText: TEST_NAMES.workoutB })).toHaveCount(0)
  })

  test('deletes category (and both exercises)', async ({ page }) => {
    // Delete exercises via API first (handles both normal and orphaned cases)
    const exercisesRes = await page.request.get('/api/exercises')
    if (exercisesRes.ok()) {
      const { exercises } = await exercisesRes.json()
      const targetNames = [
        TEST_NAMES.repsExercise.toLowerCase(),
        TEST_NAMES.timeExercise.toLowerCase(),
      ]
      const idsToDelete = exercises
        .filter((ex: { name: string }) => targetNames.includes(ex.name?.toLowerCase()))
        .map((ex: { id: string }) => ex.id)

      if (idsToDelete.length > 0) {
        await page.request.delete('/api/exercises', {
          data: { ids: idsToDelete },
        })
      }
    }

    // Delete category via API
    const categoriesRes = await page.request.get('/api/exercises/categories')
    if (categoriesRes.ok()) {
      const { categories } = await categoriesRes.json()
      const matching = categories.filter((c: { name: string }) =>
        c.name.toLowerCase() === TEST_NAMES.category.toLowerCase()
      )
      const idsToDelete = matching.map((c: { id: string }) => c.id)
      if (idsToDelete.length > 0) {
        await page.request.delete('/api/exercises/categories', {
          data: { ids: idsToDelete },
        })
      }
    }

    // Verify gone from UI
    await page.goto('/exercises')
    await expect(page.getByText(TEST_NAMES.category)).not.toBeVisible()
    await expect(page.getByText(TEST_NAMES.repsExercise)).not.toBeVisible()
    await expect(page.getByText(TEST_NAMES.timeExercise)).not.toBeVisible()
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
