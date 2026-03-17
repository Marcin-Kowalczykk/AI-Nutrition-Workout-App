import { describe, it, expect } from 'vitest'
import { getExerciseLoadType } from './get-exercise-load-type'
import { getAllRepsForExercise } from './get-all-reps-for-exercise'
import { getAllWeightsForExercise } from './get-all-weights-for-exercise'
import { getMostFrequentReps } from './get-most-frequent-reps'
import { getMaxRepsRecord } from './get-max-reps-record'
import { getMaxDurationRecord } from './get-max-duration-record'
import { getBestRecordsByReps } from './get-best-records-by-reps'
import { getBestRepsOnlyRecords } from './get-best-reps-only-records'
import { getBestDurationByWeight } from './get-best-duration-by-weight'
import type { IWorkoutItem, IWorkoutSetItem } from '@/app/api/workouts/types'

// --- factory helpers ---

let idCounter = 0
const uid = () => String(++idCounter)

const makeSet = (overrides: Partial<IWorkoutSetItem> = {}): IWorkoutSetItem => ({
  id: uid(),
  set_number: 1,
  reps: 0,
  weight: 0,
  duration: 0,
  isChecked: true,
  ...overrides,
})

const makeWorkout = (
  exerciseName: string,
  sets: Partial<IWorkoutSetItem>[],
  overrides: Partial<IWorkoutItem> = {}
): IWorkoutItem => ({
  id: uid(),
  user_id: 'user-1',
  name: 'Workout A',
  created_at: '2026-01-01T10:00:00Z',
  exercises: [{ id: uid(), name: exerciseName, sets: sets.map(makeSet) }],
  ...overrides,
})

// ----------------------------------------------------------------
describe('getExerciseLoadType', () => {
  it('returns none for empty workout list', () => {
    expect(getExerciseLoadType([], 'bench press')).toBe('none')
  })

  it('returns none for null workouts', () => {
    expect(getExerciseLoadType(null, 'bench press')).toBe('none')
  })

  it('returns none for empty exercise name', () => {
    const w = makeWorkout('bench press', [{ reps: 10, weight: 100 }])
    expect(getExerciseLoadType([w], '')).toBe('none')
  })

  it('returns none when no matching exercise found', () => {
    const w = makeWorkout('bench press', [{ reps: 10, weight: 100 }])
    expect(getExerciseLoadType([w], 'squat')).toBe('none')
  })

  it('returns weighted when exercise has sets with weight > 0', () => {
    const w = makeWorkout('bench press', [{ reps: 10, weight: 100 }])
    expect(getExerciseLoadType([w], 'bench press')).toBe('weighted')
  })

  it('returns repsOnly when exercise has sets with reps but no weight', () => {
    const w = makeWorkout('push-up', [{ reps: 20, weight: 0 }])
    expect(getExerciseLoadType([w], 'push-up')).toBe('repsOnly')
  })

  it('returns none when matching sets have reps <= 0', () => {
    const w = makeWorkout('plank', [{ reps: 0, weight: 0 }])
    expect(getExerciseLoadType([w], 'plank')).toBe('none')
  })

  it('matches exercise name accent-insensitively', () => {
    const w = makeWorkout('Wyciskanie Sztangi', [{ reps: 8, weight: 80 }])
    expect(getExerciseLoadType([w], 'wyciskanie sztangi')).toBe('weighted')
  })
})

// ----------------------------------------------------------------
describe('getAllRepsForExercise', () => {
  it('returns [] for empty workout list', () => {
    expect(getAllRepsForExercise([], 'bench press')).toEqual([])
  })

  it('returns [] for empty exercise name', () => {
    const w = makeWorkout('bench press', [{ reps: 10, isChecked: true }])
    expect(getAllRepsForExercise([w], '')).toEqual([])
  })

  it('returns unique reps sorted ascending', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, isChecked: true },
      { reps: 5, isChecked: true },
      { reps: 10, isChecked: true },
    ])
    expect(getAllRepsForExercise([w], 'bench press')).toEqual([5, 10])
  })

  it('skips sets not marked as isChecked', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, isChecked: true },
      { reps: 8, isChecked: false },
    ])
    expect(getAllRepsForExercise([w], 'bench press')).toEqual([10])
  })

  it('skips reps <= 0', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, isChecked: true },
      { reps: 0, isChecked: true },
    ])
    expect(getAllRepsForExercise([w], 'bench press')).toEqual([10])
  })

  it('limits result to 20 items', () => {
    const sets = Array.from({ length: 25 }, (_, i) => ({ reps: i + 1, isChecked: true }))
    const w = makeWorkout('bench press', sets)
    const result = getAllRepsForExercise([w], 'bench press')
    expect(result).toHaveLength(20)
    expect(result[0]).toBe(1)
    expect(result[19]).toBe(20)
  })
})

// ----------------------------------------------------------------
describe('getAllWeightsForExercise', () => {
  it('returns [] for empty workout list', () => {
    expect(getAllWeightsForExercise([], 'bench press')).toEqual([])
  })

  it('returns unique weights sorted ascending', () => {
    const w = makeWorkout('bench press', [
      { weight: 100, isChecked: true },
      { weight: 80, isChecked: true },
      { weight: 100, isChecked: true },
    ])
    expect(getAllWeightsForExercise([w], 'bench press')).toEqual([80, 100])
  })

  it('skips sets not marked as isChecked', () => {
    const w = makeWorkout('bench press', [
      { weight: 100, isChecked: true },
      { weight: 60, isChecked: false },
    ])
    expect(getAllWeightsForExercise([w], 'bench press')).toEqual([100])
  })

  it('skips weight <= 0', () => {
    const w = makeWorkout('bench press', [
      { weight: 100, isChecked: true },
      { weight: 0, isChecked: true },
    ])
    expect(getAllWeightsForExercise([w], 'bench press')).toEqual([100])
  })

  it('limits result to 20 items', () => {
    const sets = Array.from({ length: 25 }, (_, i) => ({ weight: (i + 1) * 10, isChecked: true }))
    const w = makeWorkout('bench press', sets)
    const result = getAllWeightsForExercise([w], 'bench press')
    expect(result).toHaveLength(20)
  })
})

// ----------------------------------------------------------------
describe('getMostFrequentReps', () => {
  it('returns [] for empty workout list', () => {
    expect(getMostFrequentReps([], 'bench press', 3)).toEqual([])
  })

  it('returns [] when limit <= 0', () => {
    const w = makeWorkout('bench press', [{ reps: 10 }])
    expect(getMostFrequentReps([w], 'bench press', 0)).toEqual([])
  })

  it('returns most frequent rep counts in descending frequency order', () => {
    const w = makeWorkout('bench press', [
      { reps: 10 }, { reps: 10 }, { reps: 10 },
      { reps: 8 },  { reps: 8 },
      { reps: 5 },
    ])
    expect(getMostFrequentReps([w], 'bench press', 3)).toEqual([10, 8, 5])
  })

  it('breaks frequency ties by ascending rep value', () => {
    const w = makeWorkout('bench press', [
      { reps: 8 }, { reps: 8 },
      { reps: 5 }, { reps: 5 },
    ])
    expect(getMostFrequentReps([w], 'bench press', 2)).toEqual([5, 8])
  })

  it('respects the limit', () => {
    const w = makeWorkout('bench press', [
      { reps: 10 }, { reps: 8 }, { reps: 5 },
    ])
    expect(getMostFrequentReps([w], 'bench press', 2)).toHaveLength(2)
  })
})

// ----------------------------------------------------------------
describe('getMaxRepsRecord', () => {
  it('returns null for empty workout list', () => {
    expect(getMaxRepsRecord([], 'bench press')).toBeNull()
  })

  it('returns null for empty exercise name', () => {
    const w = makeWorkout('bench press', [{ reps: 10, isChecked: true }])
    expect(getMaxRepsRecord([w], '')).toBeNull()
  })

  it('returns the record with the highest rep count', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, weight: 100, isChecked: true },
      { reps: 15, weight: 80, isChecked: true },
    ])
    expect(getMaxRepsRecord([w], 'bench press')?.reps).toBe(15)
  })

  it('breaks rep tie by picking the higher weight', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, weight: 80, isChecked: true },
      { reps: 10, weight: 100, isChecked: true },
    ])
    expect(getMaxRepsRecord([w], 'bench press')?.weight).toBe(100)
  })

  it('skips sets not marked as isChecked', () => {
    const w = makeWorkout('bench press', [
      { reps: 20, weight: 50, isChecked: false },
      { reps: 10, weight: 100, isChecked: true },
    ])
    expect(getMaxRepsRecord([w], 'bench press')?.reps).toBe(10)
  })

  it('returns weight: null when set has no weight (weight <= 0)', () => {
    const w = makeWorkout('push-up', [{ reps: 30, weight: 0, isChecked: true }])
    const result = getMaxRepsRecord([w], 'push-up')
    expect(result?.reps).toBe(30)
    expect(result?.weight).toBeNull()
  })
})

// ----------------------------------------------------------------
describe('getMaxDurationRecord', () => {
  it('returns null for empty workout list', () => {
    expect(getMaxDurationRecord([], 'plank')).toBeNull()
  })

  it('returns the record with the highest duration', () => {
    const w = makeWorkout('plank', [
      { duration: 60, weight: 0, isChecked: true },
      { duration: 120, weight: 0, isChecked: true },
    ])
    expect(getMaxDurationRecord([w], 'plank')?.duration).toBe(120)
  })

  it('breaks duration tie by picking the higher weight', () => {
    const w = makeWorkout('plank', [
      { duration: 60, weight: 10, isChecked: true },
      { duration: 60, weight: 20, isChecked: true },
    ])
    expect(getMaxDurationRecord([w], 'plank')?.weight).toBe(20)
  })

  it('skips sets not marked as isChecked', () => {
    const w = makeWorkout('plank', [
      { duration: 300, weight: 0, isChecked: false },
      { duration: 60, weight: 0, isChecked: true },
    ])
    expect(getMaxDurationRecord([w], 'plank')?.duration).toBe(60)
  })
})

// ----------------------------------------------------------------
describe('getBestRecordsByReps', () => {
  it('returns [] for empty workout list', () => {
    expect(getBestRecordsByReps([], 'bench press', [10])).toEqual([])
  })

  it('returns [] for empty repsList', () => {
    const w = makeWorkout('bench press', [{ reps: 10, weight: 100, isChecked: true }])
    expect(getBestRecordsByReps([w], 'bench press', [])).toEqual([])
  })

  it('returns the best weight for each rep count', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, weight: 100, isChecked: true },
      { reps: 10, weight: 120, isChecked: true },
      { reps: 5,  weight: 140, isChecked: true },
    ])
    const result = getBestRecordsByReps([w], 'bench press', [5, 10])
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ reps: 5, weight: 140 })
    expect(result[1]).toMatchObject({ reps: 10, weight: 120 })
  })

  it('skips sets with no weight', () => {
    const w = makeWorkout('push-up', [{ reps: 10, weight: 0, isChecked: true }])
    expect(getBestRecordsByReps([w], 'push-up', [10])).toEqual([])
  })

  it('skips sets not marked as isChecked', () => {
    const w = makeWorkout('bench press', [
      { reps: 10, weight: 150, isChecked: false },
      { reps: 10, weight: 100, isChecked: true },
    ])
    expect(getBestRecordsByReps([w], 'bench press', [10])[0].weight).toBe(100)
  })

  it('returns results sorted ascending by reps', () => {
    const w = makeWorkout('bench press', [
      { reps: 5,  weight: 140, isChecked: true },
      { reps: 10, weight: 100, isChecked: true },
    ])
    const result = getBestRecordsByReps([w], 'bench press', [10, 5])
    expect(result[0].reps).toBe(5)
    expect(result[1].reps).toBe(10)
  })
})

// ----------------------------------------------------------------
describe('getBestRepsOnlyRecords', () => {
  it('returns [] for empty workout list', () => {
    expect(getBestRepsOnlyRecords([], 'push-up', [10])).toEqual([])
  })

  it('returns [] for empty targetRepsList', () => {
    const w = makeWorkout('push-up', [{ reps: 20 }])
    expect(getBestRepsOnlyRecords([w], 'push-up', [])).toEqual([])
  })

  it('returns the best reps >= target for each target', () => {
    const w = makeWorkout('push-up', [{ reps: 25 }, { reps: 12 }])
    const result = getBestRepsOnlyRecords([w], 'push-up', [10, 20])
    expect(result[0]).toMatchObject({ targetReps: 10, bestReps: 25 })
    expect(result[1]).toMatchObject({ targetReps: 20, bestReps: 25 })
  })

  it('returns bestReps: null when no set reaches the target', () => {
    const w = makeWorkout('push-up', [{ reps: 8 }])
    const result = getBestRepsOnlyRecords([w], 'push-up', [10])
    expect(result[0]).toMatchObject({ targetReps: 10, bestReps: null, date: null })
  })

  it('returns results sorted ascending by targetReps', () => {
    const w = makeWorkout('push-up', [{ reps: 30 }])
    const result = getBestRepsOnlyRecords([w], 'push-up', [20, 10, 15])
    expect(result.map((r) => r.targetReps)).toEqual([10, 15, 20])
  })
})

// ----------------------------------------------------------------
describe('getBestDurationByWeight', () => {
  it('returns [] for empty workout list', () => {
    expect(getBestDurationByWeight([], 'plank')).toEqual([])
  })

  it('returns the best duration for each weight', () => {
    const w = makeWorkout('plank', [
      { weight: 10, duration: 60,  isChecked: true },
      { weight: 10, duration: 90,  isChecked: true },
      { weight: 20, duration: 45,  isChecked: true },
    ])
    const result = getBestDurationByWeight([w], 'plank')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ weight: 10, duration: 90 })
    expect(result[1]).toMatchObject({ weight: 20, duration: 45 })
  })

  it('skips sets with no weight or no duration', () => {
    const w = makeWorkout('plank', [
      { weight: 0,  duration: 60, isChecked: true },
      { weight: 10, duration: 0,  isChecked: true },
    ])
    expect(getBestDurationByWeight([w], 'plank')).toEqual([])
  })

  it('skips sets not marked as isChecked', () => {
    const w = makeWorkout('plank', [
      { weight: 10, duration: 300, isChecked: false },
      { weight: 10, duration: 60,  isChecked: true },
    ])
    expect(getBestDurationByWeight([w], 'plank')[0].duration).toBe(60)
  })

  it('returns results sorted ascending by weight', () => {
    const w = makeWorkout('plank', [
      { weight: 20, duration: 60, isChecked: true },
      { weight: 10, duration: 60, isChecked: true },
    ])
    const result = getBestDurationByWeight([w], 'plank')
    expect(result[0].weight).toBe(10)
    expect(result[1].weight).toBe(20)
  })
})
