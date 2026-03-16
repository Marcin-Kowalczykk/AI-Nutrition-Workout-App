import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/msw-server'
import { useGetWorkoutHistory } from './use-get-workout-history'
import { createQueryWrapper } from '../../../tests/test-utils'
import { IGetWorkoutsHistoryResponse } from '@/app/api/workouts/get-workouts-history/route'

// Mock getAccessToken — it reads from Supabase session which doesn't exist in tests
vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

describe('useGetWorkoutHistory', () => {
  it('returns workouts from API', async () => {
    server.use(
      http.get('/api/workouts/get-workouts-history', () =>
        HttpResponse.json<IGetWorkoutsHistoryResponse>({
          workouts: [{ id: '1', name: 'Push day' } as never],
          hasMore: false,
          total: 1,
        })
      )
    )

    const { result } = renderHook(() => useGetWorkoutHistory(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.workouts[0].name).toBe('Push day')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/workouts/get-workouts-history', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useGetWorkoutHistory(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/unauthorized/i)
  })

  it('is disabled when enabled: false', () => {
    const { result } = renderHook(
      () => useGetWorkoutHistory({ enabled: false }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })
})
