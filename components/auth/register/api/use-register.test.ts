import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useRegister } from './use-register'

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
describe('useRegister', () => {
  afterEach(() => {
    server.resetHandlers()
    pushMock.mockReset()
    refreshMock.mockReset()
  })

  it('calls API with encrypted password and fullName', async () => {
    let capturedBody: Record<string, unknown> | null = null

    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ user: { id: 'u1' } })
      })
    )

    const { result } = renderHook(() => useRegister(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'new@example.com', password: 'pass', fullName: 'John' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody?.password).toBe('enc:pass')
    expect(capturedBody?.fullName).toBe('John')
  })

  it('navigates to /main-page when user is returned', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ user: { id: 'u1' } })
      )
    )

    const { result } = renderHook(() => useRegister(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'new@example.com', password: 'pass', fullName: 'John' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(pushMock).toHaveBeenCalledWith('/main-page')
    expect(refreshMock).toHaveBeenCalled()
  })

  it('does not navigate when user is null in response', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ user: null })
      )
    )

    const { result } = renderHook(() => useRegister(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'new@example.com', password: 'pass', fullName: 'John' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('throws on API error', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ error: 'Email taken' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useRegister(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'taken@example.com', password: 'pass', fullName: 'John' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/registration failed/i)
  })
})
