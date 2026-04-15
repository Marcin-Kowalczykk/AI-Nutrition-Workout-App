import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useLogout } from './use-logout'

// utils
import { server } from '../../../../tests/msw-server'
import { createQueryWrapper } from '../../../../tests/test-utils'

const pushMock = vi.fn()
const refreshMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}))

vi.mock('@/components/shared/route-restorer/route-restorer', () => ({
  clearLastRoute: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
      }),
    },
  }),
}))

// ----------------------------------------------------------------
describe('useLogout', () => {
  afterEach(() => {
    server.resetHandlers()
    pushMock.mockReset()
    refreshMock.mockReset()
  })

  it('calls POST /api/auth/logout', async () => {
    let called = false

    server.use(
      http.post('/api/auth/logout', () => {
        called = true
        return HttpResponse.json({ success: true })
      })
    )

    const { result } = renderHook(() => useLogout(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(called).toBe(true)
  })

  it('navigates to /login on success', async () => {
    server.use(
      http.post('/api/auth/logout', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useLogout(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(pushMock).toHaveBeenCalledWith('/login')
    expect(refreshMock).toHaveBeenCalled()
  })

  it('clears the saved route on success', async () => {
    const { clearLastRoute } = await import('@/components/shared/route-restorer/route-restorer')

    server.use(
      http.post('/api/auth/logout', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useLogout(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(clearLastRoute).toHaveBeenCalled()
  })

  it('removes the persisted query cache from localStorage on success', async () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

    server.use(
      http.post('/api/auth/logout', () =>
        HttpResponse.json({ success: true })
      )
    )

    const { result } = renderHook(() => useLogout(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(removeItemSpy).toHaveBeenCalledWith('tanstack-query')

    removeItemSpy.mockRestore()
  })
})
