import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useCreateTemplate } from './use-create-template'
import { useUpdateTemplate } from './use-update-template'
import { useDeleteTemplate } from './use-delete-template'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

// types
import type { IWorkoutTemplateItem } from '@/app/api/workout-templates/types'
import type { ICreateTemplateResponse } from '@/app/api/workout-templates/create/route'

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
describe('useUpdateTemplate', () => {
  afterEach(() => server.resetHandlers())

  it('returns updated template on success', async () => {
    server.use(
      http.put('/api/workout-templates/update', () =>
        HttpResponse.json(makeTemplate('Updated Push'))
      )
    )

    const { result } = renderHook(() => useUpdateTemplate({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ id: 'tmpl-1', name: 'Updated Push', exercises: [] })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as IWorkoutTemplateItem | null)?.name).toBe('Updated Push')
  })

  it('calls onSuccess callback with data', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.put('/api/workout-templates/update', () =>
        HttpResponse.json(makeTemplate('My Template'))
      )
    )

    const { result } = renderHook(() => useUpdateTemplate({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ id: 'tmpl-1', name: 'My Template', exercises: [] })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(onSuccess.mock.calls[0][0]).toMatchObject({ name: 'My Template' })
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.put('/api/workout-templates/update', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useUpdateTemplate({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ id: 'tmpl-1', name: 'Push', exercises: [] })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/not found/i)
  })
})

// ----------------------------------------------------------------
describe('useDeleteTemplate', () => {
  afterEach(() => server.resetHandlers())

  it('returns success response on delete', async () => {
    server.use(
      http.delete('/api/workout-templates/delete', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteTemplate({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('tmpl-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.success).toBe(true)
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.delete('/api/workout-templates/delete', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteTemplate({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('tmpl-1')
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.delete('/api/workout-templates/delete', () =>
        HttpResponse.json({ error: 'Template not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useDeleteTemplate({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('tmpl-99')
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/template not found/i)
  })
})

// ----------------------------------------------------------------
describe('useCreateTemplate', () => {
  afterEach(() => server.resetHandlers())

  it('returns created template on success', async () => {
    server.use(
      http.post('/api/workout-templates/create', () =>
        HttpResponse.json<ICreateTemplateResponse>(makeTemplate('New Push'))
      )
    )

    const { result } = renderHook(() => useCreateTemplate({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'New Push', exercises: [] })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as IWorkoutTemplateItem | null)?.name).toBe('New Push')
  })

  it('calls onSuccess callback with data', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/workout-templates/create', () =>
        HttpResponse.json<ICreateTemplateResponse>(makeTemplate('Pull Day'))
      )
    )

    const { result } = renderHook(() => useCreateTemplate({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Pull Day', exercises: [] })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(onSuccess.mock.calls[0][0]).toMatchObject({ name: 'Pull Day' })
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/workout-templates/create', () =>
        HttpResponse.json({ error: 'Validation failed' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useCreateTemplate({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: '', exercises: [] })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/validation failed/i)
  })
})
