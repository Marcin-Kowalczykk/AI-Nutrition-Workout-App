import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Diet history', () => {
  let createdDayId: string | null = null

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
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

    // Fill in product fields
    await page.getByLabel('Product name').fill('Chicken breast')
    await page.getByLabel('Kcal').fill('165')
    await page.getByLabel('Protein [g]').fill('31')
    await page.getByLabel('Carbs [g]').fill('0')
    await page.getByLabel('Fat [g]').fill('3.6')

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/diet/create') && r.status() === 201),
      page.getByRole('button', { name: /^save$/i }).click(),
    ])
    const data = await response.json()
    createdDayId = data.id

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByTestId('diet-day-item')).toBeVisible()
  })

  test('edits an existing diet day', async ({ page }) => {
    await page.goto('/diet-history')

    // Use yesterday to avoid UNIQUE conflict with today's date from other tests
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
    await expect(page.getByTestId('diet-day-item')).toBeVisible()

    await page.getByRole('button', { name: /edit diet day/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Update kcal value
    const kcalInput = page.getByLabel('Kcal')
    await kcalInput.fill('200')
    await expect(kcalInput).toHaveValue('200')

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/diet/update') && r.status() === 200),
      page.getByRole('button', { name: /^save$/i }).click(),
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
    await expect(page.getByTestId('diet-day-item')).toBeVisible()

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
