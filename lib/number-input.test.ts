import { describe, it, expect } from 'vitest'
import { parseNumberInput, formatNumberFieldValue } from './number-input'

describe('parseNumberInput', () => {
  it('returns the number for a valid numeric string', () => {
    expect(parseNumberInput('42')).toBe(42)
    expect(parseNumberInput('3.14')).toBe(3.14)
    expect(parseNumberInput('0')).toBe(0)
  })

  it('returns undefined for an empty string', () => {
    expect(parseNumberInput('')).toBeUndefined()
  })

  it('returns undefined for a non-numeric string', () => {
    expect(parseNumberInput('abc')).toBeUndefined()
    expect(parseNumberInput('12abc')).toBeUndefined()
  })

  it('handles negative numbers', () => {
    expect(parseNumberInput('-5')).toBe(-5)
  })
})

describe('formatNumberFieldValue', () => {
  it('returns string representation of a number', () => {
    expect(formatNumberFieldValue(42)).toBe('42')
    expect(formatNumberFieldValue(0)).toBe('0')
    expect(formatNumberFieldValue(3.14)).toBe('3.14')
  })

  it('returns empty string for undefined', () => {
    expect(formatNumberFieldValue(undefined)).toBe('')
  })

  it('returns empty string for null (defensive guard in impl)', () => {
    // The implementation explicitly checks `value !== null` even though the
    // TypeScript signature only has `number | undefined`. This test covers that guard.
    expect(formatNumberFieldValue(null as unknown as undefined)).toBe('')
  })
})
