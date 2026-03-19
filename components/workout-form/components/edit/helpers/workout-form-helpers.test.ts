import { describe, it, expect } from 'vitest'
import { inferUnitType } from './infer-unit-type'
import { prepareExercisesForSubmission } from './prepare-exercises-for-submission'
import { prepareExercisesForTemplate } from './prepare-exercises-for-template'
import { getBaselineString, getComparisonBaselineString } from './get-baseline-string'
import { normalizeCachedFormData } from './normalize-cached-form-data'
import type { CreateWorkoutFormType } from '../../../types'

// --- factory helpers ---

const makeSet = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  set_number: 1,
  reps: '',
  weight: '',
  duration: '',
  isChecked: false,
  ...overrides,
})

const makeExercise = (name: string, sets: ReturnType<typeof makeSet>[] = [makeSet()]) => ({
  id: 'e1',
  name,
  unitType: 'reps-based' as const,
  sets,
})

const makeForm = (overrides: Partial<CreateWorkoutFormType> = {}): CreateWorkoutFormType => ({
  name: 'Push day',
  description: '',
  workout_date: '2026-01-15',
  exercises: [],
  ...overrides,
})

// ----------------------------------------------------------------
describe('inferUnitType', () => {
  it('returns reps-based when no duration values', () => {
    expect(inferUnitType([makeSet({ reps: '10', weight: '80' })])).toBe('reps-based')
  })

  it('returns duration when any set has duration > 0', () => {
    expect(inferUnitType([makeSet({ duration: 60 })])).toBe('duration')
  })

  it('returns reps-based for empty sets array', () => {
    expect(inferUnitType([])).toBe('reps-based')
  })

  it('returns reps-based when duration is 0', () => {
    expect(inferUnitType([makeSet({ duration: 0 })])).toBe('reps-based')
  })

  it('returns reps-based when duration is empty string', () => {
    expect(inferUnitType([makeSet({ duration: '' })])).toBe('reps-based')
  })
})

// ----------------------------------------------------------------
describe('prepareExercisesForSubmission', () => {
  it('returns empty array for empty input', () => {
    expect(prepareExercisesForSubmission([])).toEqual([])
  })

  it('filters out exercises with no name and no sets', () => {
    const result = prepareExercisesForSubmission([makeExercise('', [])])
    expect(result).toHaveLength(0)
  })

  it('keeps exercises with a name', () => {
    const result = prepareExercisesForSubmission([makeExercise('Bench Press', [])])
    expect(result).toHaveLength(1)
  })

  it('normalizes exercise name (accent-insensitive)', () => {
    const result = prepareExercisesForSubmission([makeExercise('Wyciskanie Sztangi', [])])
    expect(result[0].name).toBe('wyciskanie sztangi')
  })

  it('converts reps/weight/duration strings to numbers', () => {
    const sets = [makeSet({ reps: '10', weight: '80', duration: '', isChecked: true })]
    const result = prepareExercisesForSubmission([makeExercise('Bench Press', sets)])
    expect(result[0].sets[0].reps).toBe(10)
    expect(result[0].sets[0].weight).toBe(80)
    expect(result[0].sets[0].duration).toBe(0)
  })

  it('filters out empty sets (all fields blank)', () => {
    const sets = [makeSet({ reps: '', weight: '', duration: '' })]
    const result = prepareExercisesForSubmission([makeExercise('Bench Press', sets)])
    expect(result[0].sets).toHaveLength(0)
  })

  it('keeps sets with at least one non-empty field', () => {
    const sets = [makeSet({ reps: '5', weight: '', duration: '' })]
    const result = prepareExercisesForSubmission([makeExercise('Bench Press', sets)])
    expect(result[0].sets).toHaveLength(1)
  })

  it('preserves rpe value when set', () => {
    const sets = [makeSet({ reps: '10', rpe: 7 })]
    const result = prepareExercisesForSubmission([makeExercise('Bench', sets)])
    expect(result[0].sets[0].rpe).toBe(7)
  })

  it('converts rpe null to null, not 0', () => {
    const sets = [makeSet({ reps: '10', rpe: null })]
    const result = prepareExercisesForSubmission([makeExercise('Bench', sets)])
    expect(result[0].sets[0].rpe).toBeNull()
  })

  it('converts rpe undefined to null', () => {
    const sets = [makeSet({ reps: '10' })]
    const result = prepareExercisesForSubmission([makeExercise('Bench', sets)])
    expect(result[0].sets[0].rpe).toBeNull()
  })
})

// ----------------------------------------------------------------
describe('prepareExercisesForTemplate', () => {
  it('returns empty array for empty input', () => {
    expect(prepareExercisesForTemplate([])).toEqual([])
  })

  it('filters out exercises with empty name and no sets', () => {
    const result = prepareExercisesForTemplate([makeExercise('', [])])
    expect(result).toHaveLength(0)
  })

  it('normalizes exercise name', () => {
    const result = prepareExercisesForTemplate([makeExercise('Bench Press', [])])
    expect(result[0].name).toBe('bench press')
  })

  it('converts set values to non-negative numbers', () => {
    const sets = [makeSet({ reps: '10', weight: '80', duration: '' })]
    const result = prepareExercisesForTemplate([makeExercise('Bench Press', sets)])
    expect(result[0].sets[0].reps).toBe(10)
    expect(result[0].sets[0].weight).toBe(80)
    expect(result[0].sets[0].duration).toBe(0)
  })

  it('assigns sequential set_number when set_number is missing', () => {
    const sets = [
      { ...makeSet({ set_number: undefined }), set_number: undefined },
      { ...makeSet({ set_number: undefined }), set_number: undefined },
    ]
    const result = prepareExercisesForTemplate([makeExercise('Squat', sets)])
    expect(result[0].sets[0].set_number).toBe(1)
    expect(result[0].sets[1].set_number).toBe(2)
  })
})

// ----------------------------------------------------------------
describe('normalizeCachedFormData', () => {
  it('returns empty form for null input', () => {
    const result = normalizeCachedFormData(null, '2026-01-15', false)
    expect(result.name).toBe('')
    expect(result.exercises).toEqual([])
    expect(result.workout_date).toBe('2026-01-15')
  })

  it('returns empty form for non-object input', () => {
    const result = normalizeCachedFormData('invalid', '2026-01-15', false)
    expect(result.name).toBe('')
  })

  it('preserves name and description from cached data', () => {
    const cached = { name: 'Push day', description: 'heavy session', exercises: [] }
    const result = normalizeCachedFormData(cached, '2026-01-15', false)
    expect(result.name).toBe('Push day')
    expect(result.description).toBe('heavy session')
  })

  it('formats numeric set fields — strips zero values to empty string', () => {
    const cached = {
      name: 'Push day',
      exercises: [{ id: 'e1', name: 'Bench', sets: [{ reps: 10, weight: 80, duration: 0 }] }],
    }
    const result = normalizeCachedFormData(cached, '2026-01-15', false)
    expect(result.exercises[0].sets[0].reps).toBe('10')
    expect(result.exercises[0].sets[0].weight).toBe('80')
    expect(result.exercises[0].sets[0].duration).toBe('')
  })

  it('omits workout_date in template mode', () => {
    const cached = { name: 'My template', exercises: [] }
    const result = normalizeCachedFormData(cached, '2026-01-15', true)
    expect(result.workout_date).toBeUndefined()
  })

  it('uses defaultWorkoutDate when cached data has no workout_date', () => {
    const cached = { name: 'Workout', exercises: [] }
    const result = normalizeCachedFormData(cached, '2026-01-15', false)
    expect(result.workout_date).toBe('2026-01-15')
  })
})

// ----------------------------------------------------------------
describe('getBaselineString', () => {
  it('returns a JSON string', () => {
    const result = getBaselineString(makeForm(), false)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('includes name and exercises in the output', () => {
    const form = makeForm({ name: 'Push day', exercises: [] })
    const parsed = JSON.parse(getBaselineString(form, false))
    expect(parsed.name).toBe('Push day')
    expect(parsed.exercises).toEqual([])
  })

  it('excludes workout_date in template mode', () => {
    const form = makeForm({ workout_date: '2026-01-15' })
    const parsed = JSON.parse(getBaselineString(form, true))
    expect(parsed.workout_date).toBeUndefined()
  })

  it('includes workout_date in non-template mode', () => {
    const form = makeForm({ workout_date: '2026-01-15' })
    const parsed = JSON.parse(getBaselineString(form, false))
    expect(parsed.workout_date).toBe('2026-01-15')
  })

  it('produces different strings for different form states', () => {
    const a = getBaselineString(makeForm({ name: 'Push day' }), false)
    const b = getBaselineString(makeForm({ name: 'Pull day' }), false)
    expect(a).not.toBe(b)
  })
})

// ----------------------------------------------------------------
describe('getComparisonBaselineString', () => {
  it('returns a JSON string', () => {
    const result = getComparisonBaselineString(makeForm(), false)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('excludes workout_date in template mode', () => {
    const form = makeForm({ workout_date: '2026-01-15' })
    const parsed = JSON.parse(getComparisonBaselineString(form, true))
    expect(parsed.workout_date).toBeUndefined()
  })

  it('serializes set values including empty sets', () => {
    const sets = [makeSet({ reps: '10', weight: '80', isChecked: true })]
    const form = makeForm({ exercises: [makeExercise('Bench', sets)] })
    const parsed = JSON.parse(getComparisonBaselineString(form, false))
    expect(parsed.exercises[0].sets[0].reps).toBe(10)
    expect(parsed.exercises[0].sets[0].weight).toBe(80)
  })
})
