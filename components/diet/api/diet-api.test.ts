import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

//hooks
import { useGetDietHistory } from './use-get-diet-history'
import { useCreateDietDay } from './use-create-diet-day'
import { useUpdateDietDay } from './use-update-diet-day'
import { useDeleteDietDay } from './use-delete-diet-day'

//utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

//types
import type { IGetDietHistoryResponse } from '@/app/api/diet/get-history/route'
import type { ICreateDietDayResponse } from '@/app/api/diet/create/route'
import type { IDietDay } from '@/app/api/diet/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeDietDay = (overrides: Partial<IDietDay> = {}): IDietDay => ({
  id: 'day-1',
  user_id: 'user-1',
  date: '2026-03-30',
  created_at: '2026-03-30T10:00:00.000Z',
  updated_at: '2026-03-30T10:00:00.000Z',
  diet_meals: [],
  total_kcal: 0,
  total_protein_value: 0,
  total_carbs_value: 0,
  total_fat_value: 0,
  ...overrides,
})

// ----------------------------------------------------------------
describe('useGetDietHistory', () => {
  afterEach(() => server.resetHandlers())

  it('returns days from API', async () => {
    server.use(
      http.get('/api/diet/get-history', () =>
        HttpResponse.json<IGetDietHistoryResponse>({ days: [makeDietDay()] })
      )
    )

    const { result } = renderHook(() => useGetDietHistory(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.days).toHaveLength(1)
    expect(result.current.data?.days[0].date).toBe('2026-03-30')
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/diet/get-history', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useGetDietHistory(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/unauthorized/i)
  })

  it('is disabled when enabled: false', () => {
    const { result } = renderHook(
      () => useGetDietHistory({ enabled: false }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ----------------------------------------------------------------
describe('useCreateDietDay', () => {
  afterEach(() => server.resetHandlers())

  const payload = {
    date: '2026-03-30',
    meals: [
      {
        products: [
          {
            product_name: 'Chicken',
            product_kcal: 200,
            protein_value: 30,
            carbs_value: 0,
            fat_value: 5,
          },
        ],
      },
    ],
  }

  it('returns created diet day on success', async () => {
    server.use(
      http.post('/api/diet/create', () =>
        HttpResponse.json<ICreateDietDayResponse>(
          makeDietDay({ total_kcal: 200 }),
          { status: 201 }
        )
      )
    )

    const { result } = renderHook(() => useCreateDietDay({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => { result.current.mutate(payload) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total_kcal).toBe(200)
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/diet/create', () =>
        HttpResponse.json<ICreateDietDayResponse>(makeDietDay(), { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateDietDay({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => { result.current.mutate(payload) })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/diet/create', () =>
        HttpResponse.json({ error: 'Validation failed' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useCreateDietDay({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => { result.current.mutate(payload) })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/validation failed/i)
  })
})

// ----------------------------------------------------------------
describe('useUpdateDietDay', () => {
  afterEach(() => server.resetHandlers())

  it('returns updated diet day on success', async () => {
    server.use(
      http.put('/api/diet/update', () =>
        HttpResponse.json(makeDietDay({ total_kcal: 500 }))
      )
    )

    const { result } = renderHook(() => useUpdateDietDay({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({
        id: 'day-1',
        date: '2026-03-30',
        meals: [{ products: [] }],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total_kcal).toBe(500)
  })

  it('calls onError on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.put('/api/diet/update', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useUpdateDietDay({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ id: 'day-1', date: '2026-03-30', meals: [{ products: [] }] })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
  })
})

// ----------------------------------------------------------------
describe('useDeleteDietDay', () => {
  afterEach(() => server.resetHandlers())

  it('returns success on delete', async () => {
    server.use(
      http.delete('/api/diet/delete', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteDietDay({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => { result.current.mutate('day-1') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ success: true })
  })

  it('calls onError on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.delete('/api/diet/delete', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useDeleteDietDay({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => { result.current.mutate('day-1') })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
  })
})
