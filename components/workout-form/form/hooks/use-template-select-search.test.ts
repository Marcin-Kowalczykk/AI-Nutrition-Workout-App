import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTemplateSelectSearch } from './use-template-select-search'
import type { IWorkoutTemplateItem } from '@/app/api/workout-templates/types'

// --- factory helpers ---

let idCounter = 0
const uid = () => String(++idCounter)

const makeTemplate = (name: string, description?: string): IWorkoutTemplateItem => ({
  id: uid(),
  user_id: 'user-1',
  name,
  description,
  created_at: '2026-01-01T10:00:00Z',
})

// ----------------------------------------------------------------
describe('useTemplateSelectSearch', () => {
  it('returns all templates when search is empty', () => {
    const templates = [makeTemplate('Push A'), makeTemplate('Pull B')]
    const { result } = renderHook(() => useTemplateSelectSearch(templates))
    expect(result.current.filteredTemplates).toHaveLength(2)
  })

  it('filters templates by name (case-insensitive)', () => {
    const templates = [makeTemplate('Push A'), makeTemplate('Pull B'), makeTemplate('Leg C')]
    const { result } = renderHook(() => useTemplateSelectSearch(templates))

    act(() => {
      result.current.setSearch('leg')
    })

    expect(result.current.filteredTemplates).toHaveLength(1)
    expect(result.current.filteredTemplates[0].name).toBe('Leg C')
  })

  it('filters templates by description', () => {
    const templates = [
      makeTemplate('Template A', 'strength training'),
      makeTemplate('Template B', 'cardio session'),
    ]
    const { result } = renderHook(() => useTemplateSelectSearch(templates))

    act(() => {
      result.current.setSearch('strength')
    })

    expect(result.current.filteredTemplates).toHaveLength(1)
  })

  it('returns empty array when no templates match', () => {
    const templates = [makeTemplate('Push A')]
    const { result } = renderHook(() => useTemplateSelectSearch(templates))

    act(() => {
      result.current.setSearch('no match')
    })

    expect(result.current.filteredTemplates).toHaveLength(0)
  })

  it('trims whitespace from search term', () => {
    const templates = [makeTemplate('Push A')]
    const { result } = renderHook(() => useTemplateSelectSearch(templates))

    act(() => {
      result.current.setSearch('  push  ')
    })

    expect(result.current.filteredTemplates).toHaveLength(1)
  })

  it('search state is initially empty string', () => {
    const { result } = renderHook(() => useTemplateSelectSearch([]))
    expect(result.current.search).toBe('')
  })
})
