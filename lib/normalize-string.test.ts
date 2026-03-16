import { describe, it, expect } from 'vitest'
import { normalizeForComparison } from './normalize-string'

describe('normalizeForComparison', () => {
  it('converts to lowercase', () => {
    expect(normalizeForComparison('ABC')).toBe('abc')
  })

  it('removes Polish diacritics from lowercase input', () => {
    expect(normalizeForComparison('ą')).toBe('a')
    expect(normalizeForComparison('ć')).toBe('c')
    expect(normalizeForComparison('ę')).toBe('e')
    expect(normalizeForComparison('ł')).toBe('l')
    expect(normalizeForComparison('ń')).toBe('n')
    expect(normalizeForComparison('ó')).toBe('o')
    expect(normalizeForComparison('ś')).toBe('s')
    expect(normalizeForComparison('ź')).toBe('z')
    expect(normalizeForComparison('ż')).toBe('z')
  })

  it('removes Polish diacritics from uppercase input (end-to-end)', () => {
    // Uppercase entries in POLISH_TO_ASCII handle chars before toLower normalises them
    expect(normalizeForComparison('ĆWICZENIE')).toBe('cwiczenie')
    expect(normalizeForComparison('Łódź')).toBe('lodz')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeForComparison('  ćwiczenie  ')).toBe('cwiczenie')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeForComparison('')).toBe('')
  })

  it('returns empty string for falsy input', () => {
    expect(normalizeForComparison(null as unknown as string)).toBe('')
    expect(normalizeForComparison(undefined as unknown as string)).toBe('')
  })

  it('leaves non-Polish characters unchanged', () => {
    expect(normalizeForComparison('hello world')).toBe('hello world')
  })
})
