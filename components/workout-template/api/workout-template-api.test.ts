import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useListTemplates } from './use-list-templates'
import { useGetTemplate } from './use-get-template'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

// types
import type { IListTemplatesResponse } from '@/app/api/workout-templates/list/route'
import type { IGetTemplateResponse } from '@/app/api/workout-templates/get/route'
import type { IWorkoutTemplateItem } from '@/app/api/workout-templates/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeTemplate = (name: string): IWorkoutTemplateItem => ({
  id: 'tmpl-1',
  user_id: 'user-1',
  name,
  created_at: '2026-01-01T10:00:00Z',
})

// ----------------------------------------------------------------
describe('useListTemplates', () => {
  afterEach(() => server.resetHandlers())

  it('returns templates from API', async () => {
    server.use(
      http.get('/api/workout-templates/list', () =>
        HttpResponse.json<IListTemplatesResponse>({
          templates: [makeTemplate('Push A'), makeTemplate('Pull B')],
        })
      )
    )

    const { result } = renderHook(() => useListTemplates(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.templates).toHaveLength(2)
    expect(result.current.data?.templates[0].name).toBe('Push A')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/workout-templates/list', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useListTemplates(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/unauthorized/i)
  })
})

// ----------------------------------------------------------------
describe('useGetTemplate', () => {
  afterEach(() => server.resetHandlers())

  it('returns template data from API', async () => {
    server.use(
      http.get('/api/workout-templates/get', () =>
        HttpResponse.json<IGetTemplateResponse>({ template: makeTemplate('Push A') })
      )
    )

    const { result } = renderHook(
      () => useGetTemplate({ templateId: 'tmpl-1', enabled: true }),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Push A')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/workout-templates/get', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(
      () => useGetTemplate({ templateId: 'tmpl-1', enabled: true }),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/not found/i)
  })

  it('is disabled when enabled: false', () => {
    const { result } = renderHook(
      () => useGetTemplate({ templateId: 'tmpl-1', enabled: false }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when templateId is null', () => {
    const { result } = renderHook(
      () => useGetTemplate({ templateId: null, enabled: true }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })
})
