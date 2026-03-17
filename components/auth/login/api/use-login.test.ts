import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useLogin } from './use-login'

// utils
import { server } from '../../../../tests/msw-server'
import { createQueryWrapper } from '../../../../tests/test-utils'

const pushMock = vi.fn()
const refreshMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}))

vi.mock('@/lib/crypto', () => ({
  encryptPassword: (p: string) => `enc:${p}`,
}))

// ----------------------------------------------------------------
describe('useLogin', () => {
  afterEach(() => {
    server.resetHandlers()
    pushMock.mockReset()
    refreshMock.mockReset()
  })

  it('calls API with encrypted password', async () => {
    let capturedBody: Record<string, unknown> | null = null

    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ user: { id: 'u1' } })
      })
    )

    const { result } = renderHook(() => useLogin(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'secret' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody?.password).toBe('enc:secret')
    expect(capturedBody?.email).toBe('test@example.com')
  })

  it('navigates to /main-page on success', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ user: { id: 'u1' } })
      )
    )

    const { result } = renderHook(() => useLogin(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'secret' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(pushMock).toHaveBeenCalledWith('/main-page')
    expect(refreshMock).toHaveBeenCalled()
  })

  it('throws on API error', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      )
    )

    const { result } = renderHook(() => useLogin(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'bad@example.com', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/login failed/i)
  })
})
