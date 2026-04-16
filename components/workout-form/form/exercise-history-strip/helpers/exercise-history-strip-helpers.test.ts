import { describe, it, expect } from 'vitest'
import { filterHistoryByExerciseName } from './filter-history-by-exercise-name'
import { formatWorkoutDate } from './format-workout-date'
import { getUnitColumn } from './get-unit-column'
import { isSetChecked } from './is-set-checked'
import type { IWorkoutItem } from '@/app/api/workouts/types'

// --- factory helpers ---

let idCounter = 0
const uid = () => String(++idCounter)

const makeSet = (overrides: Record<string, unknown> = {}) => ({
  id: uid(),
  set_number: 1,
  reps: 0,
  weight: 0,
  duration: 0,
  isChecked: true,
  ...overrides,
})

const makeWorkout = (exerciseName: string, sets = [makeSet()]): IWorkoutItem => ({
  id: uid(),
  user_id: 'user-1',
  name: 'Workout',
  created_at: '2026-01-15T10:00:00Z',
  exercises: [{ id: uid(), name: exerciseName, sets }],
})

// ----------------------------------------------------------------
describe('filterHistoryByExerciseName', () => {
  it('returns [] for null workouts', () => {
    expect(filterHistoryByExerciseName(null, 'bench press')).toEqual([])
  })

  it('returns [] for empty workouts array', () => {
    expect(filterHistoryByExerciseName([], 'bench press')).toEqual([])
  })

  it('returns [] when normalizedExerciseName is empty', () => {
    const w = makeWorkout('Bench Press')
    expect(filterHistoryByExerciseName([w], '')).toEqual([])
  })

  it('returns workouts that contain the matching exercise', () => {
    const bench = makeWorkout('bench press')
    const squat = makeWorkout('squat')
    const result = filterHistoryByExerciseName([bench, squat], 'bench press')
    expect(result).toHaveLength(1)
    expect(result[0].exercises![0].name).toBe('bench press')
  })

  it('matches exercise name accent-insensitively', () => {
    const w = makeWorkout('Wyciskanie Sztangi')
    const result = filterHistoryByExerciseName([w], 'wyciskanie sztangi')
    expect(result).toHaveLength(1)
  })

  it('limits results when maxWorkouts is specified', () => {
    const workouts = [
      makeWorkout('bench press'),
      makeWorkout('bench press'),
      makeWorkout('bench press'),
    ]
    const result = filterHistoryByExerciseName(workouts, 'bench press', 2)
    expect(result).toHaveLength(2)
  })

  it('returns all results when maxWorkouts is 0', () => {
    const workouts = [makeWorkout('bench press'), makeWorkout('bench press')]
    expect(filterHistoryByExerciseName(workouts, 'bench press', 0)).toHaveLength(2)
  })
})

// ----------------------------------------------------------------
describe('formatWorkoutDate', () => {
  it('returns empty string for undefined', () => {
    expect(formatWorkoutDate(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatWorkoutDate('')).toBe('')
  })

  it('formats date in Polish locale (d MMM yyyy)', () => {
    const result = formatWorkoutDate('2026-01-15T10:00:00Z')
    // Polish: "15 sty 2026"
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2026/)
  })
})

// ----------------------------------------------------------------
describe('getUnitColumn', () => {
  it('returns null when no exercises', () => {
    expect(getUnitColumn([])).toBeNull()
  })

  it('returns null when all sets have weight=0 and duration=0', () => {
    const exercises = [{ id: '1', name: 'Plank', sets: [makeSet({ weight: 0, duration: 0 })] }]
    expect(getUnitColumn(exercises as never)).toBeNull()
  })

  it('returns "duration" when any set has duration > 0', () => {
    const exercises = [{ id: '1', name: 'Plank', sets: [makeSet({ duration: 60 })] }]
    expect(getUnitColumn(exercises as never)).toBe('duration')
  })

  it('returns "reps-based" when any set has weight > 0 and no duration', () => {
    const exercises = [{ id: '1', name: 'Bench', sets: [makeSet({ weight: 80, duration: 0 })] }]
    expect(getUnitColumn(exercises as never)).toBe('reps-based')
  })

  it('prefers duration over weight when both present', () => {
    const exercises = [
      { id: '1', name: 'Weighted plank', sets: [makeSet({ weight: 10, duration: 60 })] },
    ]
    expect(getUnitColumn(exercises as never)).toBe('duration')
  })
})

// ----------------------------------------------------------------
describe('isSetChecked', () => {
  it('returns true when isChecked is true', () => {
    expect(isSetChecked({ isChecked: true })).toBe(true)
  })

  it('returns true when is_checked is true', () => {
    expect(isSetChecked({ is_checked: true })).toBe(true)
  })

  it('returns false when both are false', () => {
    expect(isSetChecked({ isChecked: false, is_checked: false })).toBe(false)
  })

  it('returns false when both are undefined', () => {
    expect(isSetChecked({})).toBe(false)
  })

  it('returns true when isChecked is true regardless of is_checked', () => {
    expect(isSetChecked({ isChecked: true, is_checked: false })).toBe(true)
  })
})
