import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExercisesSearch } from './use-exercises-search'
import type { IExercise, IExerciseCategory } from '@/app/api/exercises/types'

// --- factory helpers ---

let idCounter = 0
const uid = () => String(++idCounter)

const makeCategory = (name: string): IExerciseCategory => ({
  id: uid(),
  user_id: 'user-1',
  name,
  created_at: '2026-01-01T10:00:00Z',
})

const makeExercise = (name: string, categoryId: string): IExercise => ({
  id: uid(),
  user_id: 'user-1',
  category_id: categoryId,
  name,
  created_at: '2026-01-01T10:00:00Z',
  unit_type: 'reps-based',
})

// ----------------------------------------------------------------
describe('useExercisesSearch — filteredCategories', () => {
  it('returns all categories with their exercises when search is empty', () => {
    const chest = makeCategory('Chest')
    const back = makeCategory('Back')
    const categories = [chest, back]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [chest.id]: [makeExercise('Bench Press', chest.id)],
      [back.id]: [makeExercise('Pull-up', back.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    expect(result.current.filteredCategories).toHaveLength(2)
  })

  it('filters by exercise name (case-insensitive)', () => {
    const chest = makeCategory('Chest')
    const back = makeCategory('Back')
    const categories = [chest, back]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [chest.id]: [makeExercise('Bench Press', chest.id)],
      [back.id]: [makeExercise('Pull-up', back.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    act(() => {
      result.current.setSearch('bench')
    })

    expect(result.current.filteredCategories).toHaveLength(1)
    expect(result.current.filteredCategories[0].category.name).toBe('Chest')
    expect(result.current.filteredCategories[0].exercises).toHaveLength(1)
  })

  it('filters by category name', () => {
    const chest = makeCategory('Chest')
    const back = makeCategory('Back')
    const categories = [chest, back]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [chest.id]: [makeExercise('Bench Press', chest.id)],
      [back.id]: [makeExercise('Pull-up', back.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    act(() => {
      result.current.setSearch('chest')
    })

    // Entire Chest category (with its exercises) should appear
    expect(result.current.filteredCategories).toHaveLength(1)
    expect(result.current.filteredCategories[0].category.name).toBe('Chest')
    expect(result.current.filteredCategories[0].exercises).toHaveLength(1)
  })

  it('returns empty array when nothing matches', () => {
    const chest = makeCategory('Chest')
    const categories = [chest]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [chest.id]: [makeExercise('Bench Press', chest.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    act(() => {
      result.current.setSearch('squat')
    })

    expect(result.current.filteredCategories).toHaveLength(0)
  })

  it('sorts "other" category to the end', () => {
    const other = makeCategory('other')
    const chest = makeCategory('Chest')
    const categories = [other, chest]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [other.id]: [makeExercise('Custom', other.id)],
      [chest.id]: [makeExercise('Bench Press', chest.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    const names = result.current.filteredCategories.map((c) => c.category.name)
    expect(names[names.length - 1]).toBe('other')
  })
})

describe('useExercisesSearch — expandedIds auto-expand', () => {
  it('expands categories that match the search query', async () => {
    const chest = makeCategory('Chest')
    const back = makeCategory('Back')
    const categories = [chest, back]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [chest.id]: [makeExercise('Bench Press', chest.id)],
      [back.id]: [makeExercise('Pull-up', back.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    act(() => {
      result.current.setSearch('bench')
    })

    await waitFor(() => {
      expect(result.current.expandedIds.has(chest.id)).toBe(true)
    })
    expect(result.current.expandedIds.has(back.id)).toBe(false)
  })

  it('clears expanded categories when search is cleared', async () => {
    const chest = makeCategory('Chest')
    const categories = [chest]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [chest.id]: [makeExercise('Bench Press', chest.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    act(() => {
      result.current.setSearch('bench')
    })
    await waitFor(() => {
      expect(result.current.expandedIds.has(chest.id)).toBe(true)
    })

    act(() => {
      result.current.setSearch('')
    })
    await waitFor(() => {
      expect(result.current.expandedIds.size).toBe(0)
    })
  })

  it('auto-expands the only "other" category when search is empty', async () => {
    const other = makeCategory('other')
    const categories = [other]
    const exercisesByCategory: Record<string, IExercise[]> = {
      [other.id]: [makeExercise('Custom', other.id)],
    }

    const { result } = renderHook(() =>
      useExercisesSearch({ categories, exercisesByCategory })
    )

    await waitFor(() => {
      expect(result.current.expandedIds.has(other.id)).toBe(true)
    })
  })
})

describe('useExercisesSearch — toggleExpanded', () => {
  it('expands a category when toggled from collapsed', () => {
    const chest = makeCategory('Chest')
    const { result } = renderHook(() =>
      useExercisesSearch({ categories: [chest], exercisesByCategory: {} })
    )

    act(() => {
      result.current.toggleExpanded(chest.id)
    })

    expect(result.current.expandedIds.has(chest.id)).toBe(true)
  })

  it('collapses a category when toggled from expanded', () => {
    const chest = makeCategory('Chest')
    const { result } = renderHook(() =>
      useExercisesSearch({ categories: [chest], exercisesByCategory: {} })
    )

    act(() => {
      result.current.toggleExpanded(chest.id)
    })
    act(() => {
      result.current.toggleExpanded(chest.id)
    })

    expect(result.current.expandedIds.has(chest.id)).toBe(false)
  })
})
