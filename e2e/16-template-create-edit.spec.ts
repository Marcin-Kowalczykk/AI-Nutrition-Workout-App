import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

const EMAIL = process.env.E2E_EMAIL!
const PASSWORD = process.env.E2E_PASSWORD!

test.describe('Template create and edit flow', () => {
  let createdTemplateId: string | null = null
  const templateName = `E2E Template Create-Edit ${Date.now()}`

  test.beforeEach(async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
  })

  test.afterEach(async ({ page }) => {
    if (createdTemplateId) {
      await page.request.delete(`/api/workout-templates/delete?id=${createdTemplateId}`)
      createdTemplateId = null
    }
  })

  test('first save creates template and redirects to edit URL', async ({ page }) => {
    await page.goto('/workout/template/create')

    const nameInput = page.getByLabel(/template name/i)
    await nameInput.fill(templateName)
    await expect(nameInput).toHaveValue(templateName)

    const [createResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workout-templates/create') && r.status() === 201),
      page.getByRole('button', { name: /save template/i }).click(),
    ])

    const data = await createResponse.json()
    createdTemplateId = data.id

    await expect(page).toHaveURL(`/workout/template/${data.id}/edit`)
  })

  test('second save updates the existing template instead of creating a new one', async ({ page }) => {
    await page.goto('/workout/template/create')

    const nameInput = page.getByLabel(/template name/i)
    await nameInput.fill(templateName)
    await expect(nameInput).toHaveValue(templateName)

    // First save — should create and redirect to edit URL
    const [createResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workout-templates/create') && r.status() === 201),
      page.getByRole('button', { name: /save template/i }).click(),
    ])

    const data = await createResponse.json()
    createdTemplateId = data.id

    await expect(page).toHaveURL(`/workout/template/${data.id}/edit`)

    // Wait for form to hydrate with loaded template data before editing
    await expect(page.getByLabel(/template name/i)).toHaveValue(templateName)

    const updatedName = `${templateName} Updated`
    await page.getByLabel(/template name/i).fill(updatedName)
    await expect(page.getByLabel(/template name/i)).toHaveValue(updatedName)

    // Second save — should call update, not create
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/workout-templates/update') && r.status() === 200),
      page.getByRole('button', { name: /update template/i }).first().click(),
    ])

    // URL should stay on the same template edit page (not a new ID)
    await expect(page).toHaveURL(`/workout/template/${data.id}/edit`)
  })
})
