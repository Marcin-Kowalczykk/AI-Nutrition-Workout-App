import { describe, it, expect } from 'vitest'
import { combineDateAndTime } from './combine-date-and-time'
import { isValidNumeric, parseNum, MAX_VALUE } from './numeric-validation'
import { buildMeasurementPayload } from './build-measurement-payload'
import { getDefaultValuesFromLast } from './get-default-values-from-last'
import { measurementToFormValues } from './measurement-to-form-values'
import { hasCircumference } from './has-circumference'
import type { IBodyMeasurementItem } from '@/app/api/body-measurements/types'
import type { AddMeasurementFormType } from '../types'

// --- factory helpers ---

const makeMeasurement = (overrides: Partial<IBodyMeasurementItem> = {}): IBodyMeasurementItem => ({
  id: '1',
  user_id: 'user-1',
  weight_kg: 75,
  height_cm: null,
  measured_at: '2026-01-15T10:30:00.000Z',
  created_at: '2026-01-15T10:30:00.000Z',
  ...overrides,
})

const makeFormValues = (overrides: Partial<AddMeasurementFormType> = {}): AddMeasurementFormType => ({
  weight_kg: '75',
  height_cm: '',
  measured_at: new Date('2026-01-15T00:00:00.000Z'),
  measured_at_time: '10:30',
  arm_cm: '',
  chest_cm: '',
  waist_cm: '',
  hips_cm: '',
  thigh_cm: '',
  calf_cm: '',
  ...overrides,
})

// ----------------------------------------------------------------
describe('combineDateAndTime', () => {
  it('sets hours and minutes from time string', () => {
    const date = new Date('2026-01-15T00:00:00.000Z')
    const result = combineDateAndTime(date, '14:30')
    expect(result.getHours()).toBe(14)
    expect(result.getMinutes()).toBe(30)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })

  it('does not modify the original date', () => {
    const date = new Date('2026-01-15T08:00:00.000Z')
    combineDateAndTime(date, '14:30')
    expect(date.getHours()).not.toBe(14)
  })

  it('returns date unchanged when timeStr is undefined', () => {
    const date = new Date('2026-01-15T08:00:00.000Z')
    const result = combineDateAndTime(date, undefined)
    expect(result.getTime()).toBe(date.getTime())
  })

  it('returns date unchanged when timeStr has invalid format', () => {
    const date = new Date('2026-01-15T08:00:00.000Z')
    const original = date.getTime()
    // regex requires \d{1,2}:\d{2} — single-digit minutes or non-numeric fail
    expect(combineDateAndTime(date, 'invalid').getTime()).toBe(original)
    expect(combineDateAndTime(date, '8:5').getTime()).toBe(original)
  })

  it('accepts single-digit hours (e.g. 9:05)', () => {
    const date = new Date('2026-01-15T00:00:00.000Z')
    const result = combineDateAndTime(date, '9:05')
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(5)
  })
})

// ----------------------------------------------------------------
describe('parseNum', () => {
  it('parses integer string', () => {
    expect(parseNum('75')).toBe(75)
  })

  it('parses decimal string with dot', () => {
    expect(parseNum('75.5')).toBe(75.5)
  })

  it('parses decimal string with comma', () => {
    expect(parseNum('75,5')).toBe(75.5)
  })

  it('returns NaN for non-numeric string', () => {
    expect(parseNum('abc')).toBeNaN()
  })
})

// ----------------------------------------------------------------
describe('isValidNumeric', () => {
  it('returns true for a valid integer', () => {
    expect(isValidNumeric('75')).toBe(true)
  })

  it('returns true for a valid decimal with 1 place', () => {
    expect(isValidNumeric('75.5')).toBe(true)
  })

  it('returns true for a comma-separated decimal', () => {
    expect(isValidNumeric('75,5')).toBe(true)
  })

  it('returns true for the max value', () => {
    expect(isValidNumeric(String(MAX_VALUE))).toBe(true)
  })

  it('returns false for zero', () => {
    expect(isValidNumeric('0')).toBe(false)
  })

  it('returns false for negative value', () => {
    expect(isValidNumeric('-1')).toBe(false)
  })

  it('returns false for value exceeding max', () => {
    expect(isValidNumeric('1000')).toBe(false)
  })

  it('returns false for more than 1 decimal place', () => {
    expect(isValidNumeric('75.55')).toBe(false)
  })

  it('returns false for non-numeric string', () => {
    expect(isValidNumeric('abc')).toBe(false)
  })
})

// ----------------------------------------------------------------
describe('buildMeasurementPayload', () => {
  it('converts weight_kg string to number', () => {
    const result = buildMeasurementPayload(makeFormValues({ weight_kg: '80' }))
    expect(result.weight_kg).toBe(80)
  })

  it('converts height_cm string to number', () => {
    const result = buildMeasurementPayload(makeFormValues({ height_cm: '180' }))
    expect(result.height_cm).toBe(180)
  })

  it('returns height_cm: null when empty', () => {
    const result = buildMeasurementPayload(makeFormValues({ height_cm: '' }))
    expect(result.height_cm).toBeNull()
  })

  it('returns circumference values as numbers when provided', () => {
    const result = buildMeasurementPayload(makeFormValues({ arm_cm: '35', chest_cm: '100' }))
    expect(result.arm_cm).toBe(35)
    expect(result.chest_cm).toBe(100)
  })

  it('returns circumference values as null when empty', () => {
    const result = buildMeasurementPayload(makeFormValues())
    expect(result.arm_cm).toBeNull()
    expect(result.waist_cm).toBeNull()
  })

  it('combines date and time into measured_at ISO string', () => {
    const result = buildMeasurementPayload(
      makeFormValues({
        measured_at: new Date('2026-01-15'),
        measured_at_time: '14:30',
      })
    )
    const date = new Date(result.measured_at)
    expect(date.getHours()).toBe(14)
    expect(date.getMinutes()).toBe(30)
  })
})

// ----------------------------------------------------------------
describe('getDefaultValuesFromLast', () => {
  it('returns empty strings and current date when no last measurement', () => {
    const result = getDefaultValuesFromLast(null)
    expect(result.weight_kg).toBe('')
    expect(result.height_cm).toBe('')
    expect(result.arm_cm).toBe('')
    expect(result.measured_at).toBeInstanceOf(Date)
    expect(result.measured_at_time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('prefills weight from last measurement', () => {
    const result = getDefaultValuesFromLast(makeMeasurement({ weight_kg: 82 }))
    expect(result.weight_kg).toBe('82')
  })

  it('prefills height from last measurement', () => {
    const result = getDefaultValuesFromLast(makeMeasurement({ height_cm: 180 }))
    expect(result.height_cm).toBe('180')
  })

  it('returns empty string for null height', () => {
    const result = getDefaultValuesFromLast(makeMeasurement({ height_cm: null }))
    expect(result.height_cm).toBe('')
  })

  it('prefills circumference values from last measurement', () => {
    const result = getDefaultValuesFromLast(makeMeasurement({ arm_cm: 35, waist_cm: 90 }))
    expect(result.arm_cm).toBe('35')
    expect(result.waist_cm).toBe('90')
  })

  it('returns empty string for null circumference values', () => {
    const result = getDefaultValuesFromLast(makeMeasurement({ arm_cm: null }))
    expect(result.arm_cm).toBe('')
  })

  it('always uses current date/time regardless of last measurement', () => {
    const before = new Date()
    const result = getDefaultValuesFromLast(makeMeasurement())
    const after = new Date()
    expect(result.measured_at.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.measured_at.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})

// ----------------------------------------------------------------
describe('measurementToFormValues', () => {
  it('converts weight_kg to string', () => {
    const result = measurementToFormValues(makeMeasurement({ weight_kg: 75 }))
    expect(result.weight_kg).toBe('75')
  })

  it('converts height_cm to string when present', () => {
    const result = measurementToFormValues(makeMeasurement({ height_cm: 178 }))
    expect(result.height_cm).toBe('178')
  })

  it('returns empty string for null height_cm', () => {
    const result = measurementToFormValues(makeMeasurement({ height_cm: null }))
    expect(result.height_cm).toBe('')
  })

  it('parses measured_at into a Date object', () => {
    const result = measurementToFormValues(makeMeasurement({ measured_at: '2026-01-15T14:30:00.000Z' }))
    expect(result.measured_at).toBeInstanceOf(Date)
  })

  it('extracts time as HH:mm string from measured_at', () => {
    const result = measurementToFormValues(makeMeasurement())
    expect(result.measured_at_time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('converts circumference values to strings', () => {
    const result = measurementToFormValues(makeMeasurement({ arm_cm: 35, chest_cm: 100 }))
    expect(result.arm_cm).toBe('35')
    expect(result.chest_cm).toBe('100')
  })

  it('returns empty string for null or undefined circumference values', () => {
    const result = measurementToFormValues(makeMeasurement({ arm_cm: null, waist_cm: undefined }))
    expect(result.arm_cm).toBe('')
    expect(result.waist_cm).toBe('')
  })
})

// ----------------------------------------------------------------
describe('hasCircumference', () => {
  it('returns false when all circumference fields are null', () => {
    const m = makeMeasurement()
    expect(hasCircumference(m)).toBe(false)
  })

  it('returns true when at least one circumference field has a value', () => {
    expect(hasCircumference(makeMeasurement({ arm_cm: 35 }))).toBe(true)
    expect(hasCircumference(makeMeasurement({ waist_cm: 90 }))).toBe(true)
    expect(hasCircumference(makeMeasurement({ calf_cm: 40 }))).toBe(true)
  })

  it('returns false when circumference fields are undefined', () => {
    const m = makeMeasurement({ arm_cm: undefined, chest_cm: undefined })
    expect(hasCircumference(m)).toBe(false)
  })
})
