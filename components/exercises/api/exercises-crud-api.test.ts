import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useCreateCategory } from './use-create-category'
import { useCreateExercise } from './use-create-exercise'
import { useDeleteCategories } from './use-delete-categories'
import { useDeleteExercises } from './use-delete-exercises'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

// ----------------------------------------------------------------
describe('useCreateCategory', () => {
  afterEach(() => server.resetHandlers())

  it('returns created category on success', async () => {
    server.use(
      http.post('/api/exercises/categories', () =>
        HttpResponse.json({ id: 'cat-1', name: 'Chest', user_id: 'u1', created_at: '' })
      )
    )

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Chest' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.name).toBe('Chest')
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/exercises/categories', () =>
        HttpResponse.json({ id: 'cat-1', name: 'Legs', user_id: 'u1', created_at: '' })
      )
    )

    const { result } = renderHook(() => useCreateCategory({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Legs' })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/exercises/categories', () =>
        HttpResponse.json({ error: 'Duplicate category' }, { status: 409 })
      )
    )

    const { result } = renderHook(() => useCreateCategory({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Chest' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/duplicate category/i)
  })
})

// ----------------------------------------------------------------
describe('useCreateExercise', () => {
  afterEach(() => server.resetHandlers())

  it('returns created exercise on success', async () => {
    server.use(
      http.post('/api/exercises', () =>
        HttpResponse.json({ id: 'ex-1', name: 'Bench Press', user_id: 'u1', category_id: 'cat-1', created_at: '', unit_type: 'reps-based' })
      )
    )

    const { result } = renderHook(() => useCreateExercise(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Bench Press', category_id: 'cat-1', unit_type: 'reps-based' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.name).toBe('Bench Press')
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/exercises', () =>
        HttpResponse.json({ id: 'ex-1', name: 'Squat', user_id: 'u1', category_id: 'cat-1', created_at: '', unit_type: 'reps-based' })
      )
    )

    const { result } = renderHook(() => useCreateExercise({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Squat', category_id: 'cat-1', unit_type: 'reps-based' })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/exercises', () =>
        HttpResponse.json({ error: 'Duplicate exercise' }, { status: 409 })
      )
    )

    const { result } = renderHook(() => useCreateExercise({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Bench Press', category_id: 'cat-1', unit_type: 'reps-based' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/duplicate exercise/i)
  })
})

// ----------------------------------------------------------------
describe('useDeleteCategories', () => {
  afterEach(() => server.resetHandlers())

  it('returns success response on delete', async () => {
    server.use(
      http.delete('/api/exercises/categories', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteCategories(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(['cat-1', 'cat-2'])
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.success).toBe(true)
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.delete('/api/exercises/categories', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useDeleteCategories({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(['cat-1'])
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/not found/i)
  })
})

// ----------------------------------------------------------------
describe('useDeleteExercises', () => {
  afterEach(() => server.resetHandlers())

  it('returns success response on delete', async () => {
    server.use(
      http.delete('/api/exercises', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteExercises(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(['ex-1', 'ex-2'])
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.success).toBe(true)
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.delete('/api/exercises', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 })
      )
    )

    const { result } = renderHook(() => useDeleteExercises({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(['ex-1'])
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/forbidden/i)
  })
})
