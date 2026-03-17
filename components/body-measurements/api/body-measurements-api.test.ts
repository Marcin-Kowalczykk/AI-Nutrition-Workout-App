import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useGetBodyMeasurementsHistory } from './use-get-body-measurements-history'
import { useCreateBodyMeasurement } from './use-create-body-measurement'
import { useUpdateBodyMeasurement } from './use-update-body-measurement'
import { useDeleteBodyMeasurement } from './use-delete-body-measurement'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

// types
import type { IGetBodyMeasurementsHistoryResponse } from '@/app/api/body-measurements/get-history/route'
import type {
  ICreateBodyMeasurementRequestBody,
  ICreateBodyMeasurementResponse,
} from '@/app/api/body-measurements/create/route'
import type { IBodyMeasurementItem } from '@/app/api/body-measurements/types'

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

const makeMeasurement = (overrides: Partial<IBodyMeasurementItem> = {}): IBodyMeasurementItem => ({
  id: '1',
  user_id: 'user-1',
  weight_kg: 75,
  height_cm: null,
  measured_at: '2026-01-15T10:30:00.000Z',
  created_at: '2026-01-15T10:30:00.000Z',
  ...overrides,
})

// ----------------------------------------------------------------
describe('useGetBodyMeasurementsHistory', () => {
  afterEach(() => server.resetHandlers())

  it('returns measurements from API', async () => {
    server.use(
      http.get('/api/body-measurements/get-history', () =>
        HttpResponse.json<IGetBodyMeasurementsHistoryResponse>({
          measurements: [makeMeasurement()],
        })
      )
    )

    const { result } = renderHook(() => useGetBodyMeasurementsHistory(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.measurements).toHaveLength(1)
    expect(result.current.data?.measurements[0].weight_kg).toBe(75)
  })

  it('propagates API error', async () => {
    server.use(
      http.get('/api/body-measurements/get-history', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useGetBodyMeasurementsHistory(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/unauthorized/i)
  })

  it('is disabled when enabled: false', () => {
    const { result } = renderHook(
      () => useGetBodyMeasurementsHistory({ enabled: false }),
      { wrapper: createQueryWrapper() }
    )
    expect(result.current.status).toBe('pending')
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ----------------------------------------------------------------
describe('useCreateBodyMeasurement', () => {
  afterEach(() => server.resetHandlers())

  const payload: ICreateBodyMeasurementRequestBody = {
    weight_kg: 76,
    height_cm: null,
    measured_at: '2026-01-15T10:30:00.000Z',
  }

  it('returns created measurement on success', async () => {
    server.use(
      http.post('/api/body-measurements/create', () =>
        HttpResponse.json<ICreateBodyMeasurementResponse>(makeMeasurement({ weight_kg: 76 }))
      )
    )

    const { result } = renderHook(() => useCreateBodyMeasurement({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.weight_kg).toBe(76)
  })

  it('calls onSuccess callback with response data', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/body-measurements/create', () =>
        HttpResponse.json<ICreateBodyMeasurementResponse>(makeMeasurement())
      )
    )

    const { result } = renderHook(() => useCreateBodyMeasurement({ onSuccess }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/body-measurements/create', () =>
        HttpResponse.json({ error: 'Validation failed' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useCreateBodyMeasurement({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/validation failed/i)
  })
})

// ----------------------------------------------------------------
describe('useUpdateBodyMeasurement', () => {
  afterEach(() => server.resetHandlers())

  it('returns updated measurement on success', async () => {
    server.use(
      http.patch('/api/body-measurements/update', () =>
        HttpResponse.json(makeMeasurement({ weight_kg: 80 }))
      )
    )

    const { result } = renderHook(
      () => useUpdateBodyMeasurement({ measurementId: '1' }),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ weight_kg: 80, measured_at: '2026-01-15T10:30:00.000Z' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.weight_kg).toBe(80)
  })

  it('calls onError on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.patch('/api/body-measurements/update', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(
      () => useUpdateBodyMeasurement({ measurementId: '1', onError }),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ weight_kg: 80, measured_at: '2026-01-15T10:30:00.000Z' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
  })
})

// ----------------------------------------------------------------
describe('useDeleteBodyMeasurement', () => {
  afterEach(() => server.resetHandlers())

  it('returns success on delete', async () => {
    server.use(
      http.delete('/api/body-measurements/delete', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useDeleteBodyMeasurement({}), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('measurement-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ success: true })
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.delete('/api/body-measurements/delete', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useDeleteBodyMeasurement({ onError }), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate('measurement-1')
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
  })
})
