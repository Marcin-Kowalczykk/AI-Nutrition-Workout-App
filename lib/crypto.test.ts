import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptPassword, decryptPassword } from './crypto'

const TEST_KEY = 'test-encryption-key-123'

describe('encryptPassword', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENCRYPTION_KEY = TEST_KEY
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
  })

  it('returns a non-empty encrypted string', () => {
    const result = encryptPassword('mypassword')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('does not return the original password in plain text', () => {
    const result = encryptPassword('mypassword')
    expect(result).not.toBe('mypassword')
  })

  it('produces different output for different inputs', () => {
    const a = encryptPassword('password1')
    const b = encryptPassword('password2')
    expect(a).not.toBe(b)
  })

  it('throws when NEXT_PUBLIC_ENCRYPTION_KEY is not set', () => {
    delete process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    expect(() => encryptPassword('mypassword')).toThrow(
      'NEXT_PUBLIC_ENCRYPTION_KEY is not set in environment variables'
    )
  })
})

describe('decryptPassword', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENCRYPTION_KEY = TEST_KEY
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
  })

  it('decrypts a value encrypted with the same key', () => {
    const original = 'supersecret'
    const encrypted = encryptPassword(original)
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe(original)
  })

  it('decrypts using ENCRYPTION_KEY when both env vars are set', () => {
    process.env.ENCRYPTION_KEY = TEST_KEY
    const encrypted = encryptPassword('mypassword')
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe('mypassword')
  })

  it('decrypts using NEXT_PUBLIC_ENCRYPTION_KEY as fallback', () => {
    delete process.env.ENCRYPTION_KEY
    const encrypted = encryptPassword('mypassword')
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe('mypassword')
  })

  it('throws when neither key env var is set', () => {
    delete process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    expect(() => decryptPassword('some-encrypted-value')).toThrow(
      'ENCRYPTION_KEY or NEXT_PUBLIC_ENCRYPTION_KEY is not set in environment variables'
    )
  })

  it('throws when decrypting with wrong key', () => {
    const encrypted = encryptPassword('mypassword')
    process.env.NEXT_PUBLIC_ENCRYPTION_KEY = 'wrong-key'
    expect(() => decryptPassword(encrypted)).toThrow(
      'Failed to decrypt password. Invalid encryption key or data.'
    )
  })
})
