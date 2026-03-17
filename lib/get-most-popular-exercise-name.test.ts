import { describe, it, expect } from 'vitest'
import { getMostPopularExerciseName } from './get-most-popular-exercise-name'
import type { IWorkoutItem, IWorkoutExerciseItem } from '@/app/api/workouts/types'

// --- factory helpers ---

let idCounter = 0
const uid = () => String(++idCounter)

const makeWorkout = (exerciseNames: string[]): IWorkoutItem => ({
  id: uid(),
  user_id: 'user-1',
  name: 'Workout',
  created_at: '2026-01-01T10:00:00Z',
  exercises: exerciseNames.map((name) => ({
    id: uid(),
    name,
    sets: [],
  })) as IWorkoutExerciseItem[],
})

// ----------------------------------------------------------------
describe('getMostPopularExerciseName', () => {
  it('returns null for null input', () => {
    expect(getMostPopularExerciseName(null)).toBeNull()
  })

  it('returns null for empty workout list', () => {
    expect(getMostPopularExerciseName([])).toBeNull()
  })

  it('returns null when workouts have no exercises', () => {
    const w = makeWorkout([])
    expect(getMostPopularExerciseName([w])).toBeNull()
  })

  it('returns the only exercise name when there is one workout', () => {
    const w = makeWorkout(['bench press'])
    expect(getMostPopularExerciseName([w])).toBe('bench press')
  })

  it('returns the most frequently occurring exercise', () => {
    const workouts = [
      makeWorkout(['bench press', 'squat']),
      makeWorkout(['bench press', 'deadlift']),
      makeWorkout(['squat']),
    ]
    expect(getMostPopularExerciseName(workouts)).toBe('bench press')
  })

  it('matches exercise names accent-insensitively', () => {
    const workouts = [
      makeWorkout(['Wyciskanie Sztangi']),
      makeWorkout(['wyciskanie sztangi']),
    ]
    // Both count as the same exercise — result should be one of the original names
    const result = getMostPopularExerciseName(workouts)
    expect(result?.toLowerCase()).toBe('wyciskanie sztangi')
  })

  it('on frequency tie picks alphabetically first by displayName', () => {
    const workouts = [
      makeWorkout(['squat']),
      makeWorkout(['bench press']),
    ]
    // Both appear once; 'bench press' < 'squat' alphabetically
    expect(getMostPopularExerciseName(workouts)).toBe('bench press')
  })

  it('returns the display name (original casing) not the normalized name', () => {
    const w = makeWorkout(['Bench Press'])
    expect(getMostPopularExerciseName([w])).toBe('Bench Press')
  })

  it('skips exercises with empty names', () => {
    const workouts = [
      makeWorkout(['', 'squat']),
      makeWorkout(['squat']),
    ]
    expect(getMostPopularExerciseName(workouts)).toBe('squat')
  })
})
