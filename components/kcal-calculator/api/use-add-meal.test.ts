import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

//hooks
import { useAddMeal } from './use-add-meal'

//utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

//types
import type { IAddMealResponse } from '@/app/api/diet/add-meal/route'
import type { IDietDay } from '@/app/api/diet/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeDietDay = (overrides: Partial<IDietDay> = {}): IDietDay => ({
  id: 'day-1',
  user_id: 'user-1',
  date: '2026-04-08',
  created_at: '2026-04-08T10:00:00.000Z',
  updated_at: '2026-04-08T10:00:00.000Z',
  diet_meals: [],
  total_kcal: 300,
  total_protein_value: 30,
  total_carbs_value: 20,
  total_fat_value: 10,
  ...overrides,
})

const sampleProducts = [
  {
    product_name: 'Chicken breast',
    kcal: '165',
    protein: '31',
    carbs: '0',
    fat: '3.6',
    weight_grams: '100',
    breakdown: null,
  },
]

// ----------------------------------------------------------------
describe('useAddMeal', () => {
  afterEach(() => server.resetHandlers())

  it('returns the updated diet day on success', async () => {
    server.use(
      http.post('/api/diet/add-meal', () =>
        HttpResponse.json<IAddMealResponse>(makeDietDay({ total_kcal: 165 }), { status: 201 })
      )
    )

    const { result } = renderHook(() => useAddMeal(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ products: sampleProducts, target_date: '2026-04-08' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total_kcal).toBe(165)
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/diet/add-meal', () =>
        HttpResponse.json<IAddMealResponse>(makeDietDay(), { status: 201 })
      )
    )

    const { result } = renderHook(() => useAddMeal({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ products: sampleProducts, target_date: '2026-04-08' })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/diet/add-meal', () =>
        HttpResponse.json({ error: 'products is required' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useAddMeal({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ products: [], target_date: '2026-04-08' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/products is required/i)
  })
})
