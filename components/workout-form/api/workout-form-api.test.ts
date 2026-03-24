import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// hooks
import { useCreateWorkout } from './use-create-workout'
import { useUpdateWorkout } from './use-update-workout'
import { useDeleteWorkout } from './use-delete-workout'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, Wrapper }
}

// types
import type { ICreateWorkoutResponse } from '@/app/api/workouts/create-new-workout/route'
import type { IUpdateWorkoutResponse } from '@/app/api/workouts/update-workout/route'
import type { IDeleteWorkoutResponse } from '@/app/api/workouts/delete-workout/route'
import type { IWorkoutItem } from '@/app/api/workouts/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeWorkout = (overrides: Partial<IWorkoutItem> = {}): IWorkoutItem => ({
  id: 'workout-1',
  user_id: 'user-1',
  name: 'Push day',
  created_at: '2026-01-01T10:00:00Z',
  ...overrides,
})

// ----------------------------------------------------------------
describe('useCreateWorkout', () => {
  afterEach(() => server.resetHandlers())

  it('returns created workout on success', async () => {
    server.use(
      http.post('/api/workouts/create-new-workout', () =>
        HttpResponse.json<ICreateWorkoutResponse>(makeWorkout({ name: 'Leg day' }))
      )
    )

    const { result } = renderHook(() => useCreateWorkout({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Leg day' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Leg day')
  })

  it('calls onSuccess callback with response data', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/workouts/create-new-workout', () =>
        HttpResponse.json<ICreateWorkoutResponse>(makeWorkout())
      )
    )

    const { result } = renderHook(() => useCreateWorkout({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: 'Push day' })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/workouts/create-new-workout', () =>
        HttpResponse.json({ error: 'Name is required' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useCreateWorkout({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ name: '' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/name is required/i)
  })
})

// ----------------------------------------------------------------
describe('useUpdateWorkout', () => {
  afterEach(() => server.resetHandlers())

  it('returns updated workout on success', async () => {
    server.use(
      http.put('/api/workouts/update-workout', () =>
        HttpResponse.json<IUpdateWorkoutResponse>(makeWorkout({ name: 'Updated push day' }))
      )
    )

    const { result } = renderHook(() => useUpdateWorkout({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ id: 'workout-1', name: 'Updated push day' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Updated push day')
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.put('/api/workouts/update-workout', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useUpdateWorkout({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ id: 'workout-1' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
  })
})

// ----------------------------------------------------------------
describe('useDeleteWorkout', () => {
  afterEach(() => server.resetHandlers())

  it('returns success on delete', async () => {
    server.use(
      http.delete('/api/workouts/delete-workout', () =>
        HttpResponse.json<IDeleteWorkoutResponse>({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteWorkout({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('workout-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ success: true })
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.delete('/api/workouts/delete-workout', () =>
        HttpResponse.json<IDeleteWorkoutResponse>({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteWorkout({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('workout-1')
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.delete('/api/workouts/delete-workout', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useDeleteWorkout({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('workout-1')
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
  })

  it('removes get-single-workout cache entry on success', async () => {
    server.use(
      http.delete('/api/workouts/delete-workout', () =>
        HttpResponse.json<IDeleteWorkoutResponse>({ success: true })
      )
    )

    const { queryClient, Wrapper } = createQueryClientWrapper()
    queryClient.setQueryData(['get-single-workout', 'workout-1'], makeWorkout())

    const { result } = renderHook(() => useDeleteWorkout({}), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('workout-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(['get-single-workout', 'workout-1'])).toBeUndefined()
  })

  it('invalidates get-workout-history on success', async () => {
    server.use(
      http.delete('/api/workouts/delete-workout', () =>
        HttpResponse.json<IDeleteWorkoutResponse>({ success: true })
      )
    )

    const { queryClient, Wrapper } = createQueryClientWrapper()
    queryClient.setQueryData(['get-workout-history'], { workouts: [] })

    const { result } = renderHook(() => useDeleteWorkout({}), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('workout-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryState(['get-workout-history'])?.isInvalidated).toBe(true)
  })
})
