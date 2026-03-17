import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

// hooks
import { useUpdateProfile } from './use-update-profile'

// utils
import { server } from '../../../tests/msw-server'
import { createQueryWrapper } from '../../../tests/test-utils'

const setThemeMock = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: setThemeMock }),
}))

vi.mock('@/lib/supabase/get-access-token', () => ({
  getAccessToken: async () => 'test-token',
}))

vi.mock('@/lib/crypto', () => ({
  encryptPassword: (p: string) => `enc:${p}`,
}))

// ----------------------------------------------------------------
describe('useUpdateProfile', () => {
  afterEach(() => {
    server.resetHandlers()
    setThemeMock.mockReset()
  })

  it('returns success message on update', async () => {
    server.use(
      http.post('/api/profile/update-profile', () =>
        HttpResponse.json({ message: 'Profile updated' })
      )
    )

    const { result } = renderHook(
      () => useUpdateProfile({ onSuccess: vi.fn() }),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ fullName: 'John Doe' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe('Profile updated')
  })

  it('calls onSuccess callback with message', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/profile/update-profile', () =>
        HttpResponse.json({ message: 'Profile updated successfully' })
      )
    )

    const { result } = renderHook(
      () => useUpdateProfile({ onSuccess }),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ fullName: 'Jane Doe' })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(onSuccess.mock.calls[0][0]).toBe('Profile updated successfully')
  })

  it('calls setTheme when theme is provided', async () => {
    server.use(
      http.post('/api/profile/update-profile', () =>
        HttpResponse.json({ message: 'Theme updated' })
      )
    )

    const { result } = renderHook(
      () => useUpdateProfile({}),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ theme: 'dark' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('does not call setTheme when theme is not provided', async () => {
    server.use(
      http.post('/api/profile/update-profile', () =>
        HttpResponse.json({ message: 'Name updated' })
      )
    )

    const { result } = renderHook(
      () => useUpdateProfile({}),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ fullName: 'John' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(setThemeMock).not.toHaveBeenCalled()
  })

  it('sends encrypted password when password is provided', async () => {
    let capturedBody: Record<string, unknown> | null = null

    server.use(
      http.post('/api/profile/update-profile', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ message: 'Password updated' })
      })
    )

    const { result } = renderHook(
      () => useUpdateProfile({}),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ password: 'newpass' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedBody?.password).toBe('enc:newpass')
  })

  it('calls onError callback on API failure', async () => {
    const onError = vi.fn()
    server.use(
      http.post('/api/profile/update-profile', () =>
        HttpResponse.json({ error: 'Validation failed' }, { status: 400 })
      )
    )

    const { result } = renderHook(
      () => useUpdateProfile({ onError }),
      { wrapper: createQueryWrapper() }
    )

    act(() => {
      result.current.mutate({ fullName: 'Bad Input' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatch(/validation failed/i)
  })
})
