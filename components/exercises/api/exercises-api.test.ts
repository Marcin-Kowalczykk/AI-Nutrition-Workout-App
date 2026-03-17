import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useListExercises } from './use-list-exercises'
import { useListCategories } from './use-list-categories'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

// types
import type { IListExercisesResponse } from '@/app/api/exercises/route'
import type { IListCategoriesResponse } from '@/app/api/exercises/categories/route'
import type { IExercise, IExerciseCategory } from '@/app/api/exercises/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeExercise = (name: string): IExercise => ({
  id: '1',
  user_id: 'user-1',
  category_id: 'cat-1',
  name,
  created_at: '2026-01-01T10:00:00Z',
  unit_type: 'reps-based',
})

const makeCategory = (name: string): IExerciseCategory => ({
  id: 'cat-1',
  user_id: 'user-1',
  name,
  created_at: '2026-01-01T10:00:00Z',
})

// ----------------------------------------------------------------
describe('useListExercises', () => {
  afterEach(() => server.resetHandlers())

  it('returns exercises from API', async () => {
    server.use(
      http.get('/api/exercises', () =>
        HttpResponse.json<IListExercisesResponse>({
          exercises: [makeExercise('Bench Press')],
        })
      )
    )

    const { result } = renderHook(() => useListExercises(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.exercises).toHaveLength(1)
    expect(result.current.data?.exercises[0].name).toBe('Bench Press')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/exercises', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useListExercises(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/unauthorized/i)
  })
})

// ----------------------------------------------------------------
describe('useListCategories', () => {
  afterEach(() => server.resetHandlers())

  it('returns categories from API', async () => {
    server.use(
      http.get('/api/exercises/categories', () =>
        HttpResponse.json<IListCategoriesResponse>({
          categories: [makeCategory('Chest'), makeCategory('Back')],
        })
      )
    )

    const { result } = renderHook(() => useListCategories(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.categories).toHaveLength(2)
    expect(result.current.data?.categories[0].name).toBe('Chest')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/exercises/categories', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useListCategories(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/server error/i)
  })
})
