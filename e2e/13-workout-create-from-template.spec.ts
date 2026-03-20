import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Create workout from template', () => {
  let createdTemplateId: string | null = null
  const templateName = `E2E Template ${Date.now()}`

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    const res = await page.request.post('/api/workout-templates/create', {
      data: { name: templateName, exercises: [] },
    })
    if (res.ok()) {
      const data = await res.json()
      createdTemplateId = data.id
    }
  })

  test.afterEach(async ({ page }) => {
    if (!createdTemplateId) return
    await page.request.delete(`/api/workout-templates/delete?id=${createdTemplateId}`)
    createdTemplateId = null
  })

  test('pre-fills workout form when a template is selected from the dropdown', async ({ page }) => {
    await page.goto('/workout/create')

    await page.locator('#template-select').click()

    const templateOption = page.getByRole('option', { name: templateName })
    await expect(templateOption).toBeVisible()
    await templateOption.click()

    const nameInput = page.getByLabel(/workout name/i)
    await expect(nameInput).toHaveValue(templateName)
  })
})
