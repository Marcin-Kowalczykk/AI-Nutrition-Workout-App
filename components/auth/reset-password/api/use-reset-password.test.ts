import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useResetPassword } from './use-reset-password'

// utils
import { server } from '../../../../tests/msw-server'
import { createQueryWrapper } from '../../../../tests/test-utils'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/lib/crypto', () => ({
  encryptPassword: (p: string) => `enc:${p}`,
}))

// ----------------------------------------------------------------
describe('useResetPassword', () => {
  afterEach(() => {
    server.resetHandlers()
    pushMock.mockReset()
    vi.clearAllTimers()
  })

  it('calls API with encrypted password', async () => {
    let capturedBody: Record<string, unknown> | null = null

    server.use(
      http.post('/api/auth/reset-password', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ message: 'Password updated' })
      })
    )

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ password: 'newpass' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody?.password).toBe('enc:newpass')
  })

  it('returns success data from API', async () => {
    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json({ message: 'Password updated' })
      )
    )

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ password: 'newpass' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.message).toBe('Password updated')
  })

  it('throws on API error', async () => {
    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json({ error: 'Token expired' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ password: 'newpass' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/failed to reset password/i)
  })
})
