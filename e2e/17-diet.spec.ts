import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Diet history', () => {
  let createdDayId: string | null = null

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)

    // Clean up any leftover diet entries from the last 7 days (from previous failed runs)
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

  test.afterEach(async ({ page }) => {
    if (createdDayId) {
      await page.request.delete(`/api/diet/delete?id=${createdDayId}`)
      createdDayId = null
    }
  })

  test('adds a new diet day', async ({ page }) => {
    await page.goto('/diet-history')

    await page.getByRole('button', { name: /add diet day/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // New product starts in edit mode (empty product_name)
    await page.getByLabel('Product name').fill('Chicken breast')
    await page.getByLabel('Kcal').fill('165')
    await page.getByLabel('Protein [g]').fill('31')
    await page.getByLabel('Carbs [g]').fill('0')
    await page.getByLabel('Fat [g]').fill('3.6')

    // Use the main Save button (SheetFooter, type="submit") — .last() avoids the
    // product-level Save button that is also visible when a product is in edit mode
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/diet/create')),
      page.getByRole('button', { name: /^save$/i }).last().click(),
    ])
    expect(response.status()).toBe(201)
    const data = await response.json()
    createdDayId = data.id

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByTestId('diet-day-item').first()).toBeVisible()
  })

  test('edits an existing diet day', async ({ page }) => {
    await page.goto('/diet-history')

    // Use yesterday to avoid UNIQUE conflict with today from the "adds" test
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Create via API for isolation
    const createResponse = await page.request.post('/api/diet/create', {
      data: {
        date: yesterday.toISOString().split('T')[0],
        meals: [{ products: [{ product_name: 'Rice', product_kcal: 130, protein_value: 2.7, carbs_value: 28, fat_value: 0.3 }] }],
      },
    })
    expect(createResponse.status()).toBe(201)
    const created = await createResponse.json()
    createdDayId = created.id

    await page.reload()
    await expect(page.getByTestId('diet-day-item').first()).toBeVisible()

    await page.getByRole('button', { name: /edit diet day/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Meals are collapsed by default when editing — expand Meal 1 first
    await page.getByRole('button', { name: /meal 1/i }).click()

    // Existing products start in view mode — click the pencil to enter edit mode
    await page.getByRole('button', { name: /edit product 1/i }).click()

    // Update kcal value
    const kcalInput = page.getByLabel('Kcal')
    await kcalInput.fill('200')
    await expect(kcalInput).toHaveValue('200')

    // Footer button says "Update" (not "Save") when editing — click it directly
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/diet/update')),
      page.getByRole('button', { name: /^update$/i }).click(),
    ])
    expect(response.status()).toBe(200)

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('deletes a diet day', async ({ page }) => {
    await page.goto('/diet-history')

    // Use 2 days ago to avoid UNIQUE conflict with other tests
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Create via API for isolation
    const createResponse = await page.request.post('/api/diet/create', {
      data: {
        date: twoDaysAgo.toISOString().split('T')[0],
        meals: [{ products: [{ product_name: 'Oats', product_kcal: 150, protein_value: 5, carbs_value: 27, fat_value: 2.5 }] }],
      },
    })
    expect(createResponse.status()).toBe(201)
    const created = await createResponse.json()
    createdDayId = created.id

    await page.reload()
    await expect(page.getByTestId('diet-day-item').first()).toBeVisible()

    await page.getByRole('button', { name: /delete diet day/i }).first().click()

    // Confirm modal
    await expect(page.getByRole('dialog')).toBeVisible()
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/diet/delete') && r.status() === 200),
      page.getByRole('button', { name: /^delete$/i }).click(),
    ])

    createdDayId = null
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
