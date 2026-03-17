import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useGetWorkout } from './use-get-workout'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

// types
import type { IWorkoutItem } from '@/app/api/workouts/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeWorkout = (): IWorkoutItem => ({
  id: 'wkt-1',
  user_id: 'user-1',
  name: 'Push Day',
  created_at: '2026-01-15T10:00:00Z',
  exercises: [],
})

// ----------------------------------------------------------------
describe('useGetWorkout', () => {
  afterEach(() => server.resetHandlers())

  it('returns workout data from API', async () => {
    server.use(
      http.get('/api/workouts/get-workout', () =>
        HttpResponse.json({ workout: makeWorkout() })
      )
    )

    const { result } = renderHook(
      () => useGetWorkout({ workoutId: 'wkt-1' }),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Push Day')
    expect(result.current.data?.id).toBe('wkt-1')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/workouts/get-workout', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(
      () => useGetWorkout({ workoutId: 'wkt-missing' }),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/not found/i)
  })

  it('is disabled when workoutId is null', () => {
    const { result } = renderHook(
      () => useGetWorkout({ workoutId: null }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled: false', () => {
    const { result } = renderHook(
      () => useGetWorkout({ workoutId: 'wkt-1', enabled: false }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })
})
