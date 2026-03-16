import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getFormCache, setFormCache, removeFormCache, clearAllFormCache } from './form-cache'

// jsdom does not implement IndexedDB — the cache module will fall back to localStorage
describe('form-cache (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('setFormCache stores a value and getFormCache retrieves it', async () => {
    await setFormCache('workout-form-draft-1', '{"name":"Push day"}')
    const result = await getFormCache('workout-form-draft-1')
    expect(result).toBe('{"name":"Push day"}')
  })

  it('getFormCache returns null for a key that does not exist', async () => {
    const result = await getFormCache('nonexistent-key')
    expect(result).toBeNull()
  })

  it('removeFormCache deletes the stored value', async () => {
    await setFormCache('workout-form-draft-2', 'data')
    await removeFormCache('workout-form-draft-2')
    const result = await getFormCache('workout-form-draft-2')
    expect(result).toBeNull()
  })

  it('clearAllFormCache removes only workout-form-draft and workout-template-form-draft keys', async () => {
    // NOTE: This test exercises the localStorage fallback path only (jsdom has no IndexedDB).
    // The IndexedDB path calls store.clear() which removes ALL entries — not just workout keys.
    // The key-selective behaviour asserted here is specific to the localStorage fallback.
    localStorage.setItem('workout-form-draft-1', 'a')
    localStorage.setItem('workout-template-form-draft-1', 'b')
    localStorage.setItem('unrelated-key', 'c')

    await clearAllFormCache()

    expect(localStorage.getItem('workout-form-draft-1')).toBeNull()
    expect(localStorage.getItem('workout-template-form-draft-1')).toBeNull()
    expect(localStorage.getItem('unrelated-key')).toBe('c')
  })
})
