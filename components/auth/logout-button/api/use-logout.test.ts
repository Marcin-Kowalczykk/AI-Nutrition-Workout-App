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
})
