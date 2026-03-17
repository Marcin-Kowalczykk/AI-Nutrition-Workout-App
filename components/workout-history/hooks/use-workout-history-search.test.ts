import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkoutHistorySearch } from './use-workout-history-search'
import type { IWorkoutItem } from '@/app/api/workouts/types'

// --- factory helpers ---

let idCounter = 0
const uid = () => String(++idCounter)

const makeWorkout = (name: string, description?: string): IWorkoutItem => ({
  id: uid(),
  user_id: 'user-1',
  name,
  description,
  created_at: '2026-01-01T10:00:00Z',
})

// ----------------------------------------------------------------
describe('useWorkoutHistorySearch', () => {
  it('returns all workouts when search is empty', () => {
    const workouts = [makeWorkout('Push day'), makeWorkout('Pull day')]
    const { result } = renderHook(() => useWorkoutHistorySearch(workouts))
    expect(result.current.filteredWorkouts).toHaveLength(2)
  })

  it('filters workouts by name (case-insensitive)', () => {
    const workouts = [makeWorkout('Push day'), makeWorkout('Pull day'), makeWorkout('Leg day')]
    const { result } = renderHook(() => useWorkoutHistorySearch(workouts))

    act(() => {
      result.current.setSearch('push')
    })

    expect(result.current.filteredWorkouts).toHaveLength(1)
    expect(result.current.filteredWorkouts[0].name).toBe('Push day')
  })

  it('filters workouts by description', () => {
    const workouts = [
      makeWorkout('Workout A', 'chest and triceps'),
      makeWorkout('Workout B', 'back and biceps'),
    ]
    const { result } = renderHook(() => useWorkoutHistorySearch(workouts))

    act(() => {
      result.current.setSearch('chest')
    })

    expect(result.current.filteredWorkouts).toHaveLength(1)
    expect(result.current.filteredWorkouts[0].name).toBe('Workout A')
  })

  it('returns empty array when no workouts match', () => {
    const workouts = [makeWorkout('Push day'), makeWorkout('Pull day')]
    const { result } = renderHook(() => useWorkoutHistorySearch(workouts))

    act(() => {
      result.current.setSearch('squat')
    })

    expect(result.current.filteredWorkouts).toHaveLength(0)
  })

  it('trims whitespace from search term', () => {
    const workouts = [makeWorkout('Push day')]
    const { result } = renderHook(() => useWorkoutHistorySearch(workouts))

    act(() => {
      result.current.setSearch('  push  ')
    })

    expect(result.current.filteredWorkouts).toHaveLength(1)
  })

  it('hasAnyWorkouts is true when workouts array is not empty', () => {
    const workouts = [makeWorkout('Push day')]
    const { result } = renderHook(() => useWorkoutHistorySearch(workouts))

    act(() => {
      result.current.setSearch('no match')
    })

    // Even when filtered list is empty, hasAnyWorkouts reflects the original list
    expect(result.current.hasAnyWorkouts).toBe(true)
    expect(result.current.filteredWorkouts).toHaveLength(0)
  })

  it('hasAnyWorkouts is false when workouts array is empty', () => {
    const { result } = renderHook(() => useWorkoutHistorySearch([]))
    expect(result.current.hasAnyWorkouts).toBe(false)
  })

  it('search state is initially empty string', () => {
    const { result } = renderHook(() => useWorkoutHistorySearch([]))
    expect(result.current.search).toBe('')
  })
})
