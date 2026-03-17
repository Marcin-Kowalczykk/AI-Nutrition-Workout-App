import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useForgotPassword } from './use-forgot-password'

// utils
import { server } from '../../../../tests/msw-server'
import { createQueryWrapper } from '../../../../tests/test-utils'

// ----------------------------------------------------------------
describe('useForgotPassword', () => {
  afterEach(() => server.resetHandlers())

  it('calls API with email', async () => {
    let capturedBody: Record<string, unknown> | null = null

    server.use(
      http.post('/api/auth/forgot-password', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ message: 'Email sent' })
      })
    )

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'user@example.com' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody?.email).toBe('user@example.com')
  })

  it('returns response data on success', async () => {
    server.use(
      http.post('/api/auth/forgot-password', () =>
        HttpResponse.json({ message: 'Reset link sent' })
      )
    )

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'user@example.com' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect((result.current.data as Record<string, unknown>)?.message).toBe('Reset link sent')
  })

  it('throws on API error', async () => {
    server.use(
      http.post('/api/auth/forgot-password', () =>
        HttpResponse.json({ error: 'User not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createQueryWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'unknown@example.com' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/failed to send reset email/i)
  })
})
