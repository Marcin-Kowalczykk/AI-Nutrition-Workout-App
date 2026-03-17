import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTemplateSearch } from './use-template-search'
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
describe('useTemplateSearch', () => {
  it('returns all templates when search is empty', () => {
    const templates = [makeTemplate('Push A'), makeTemplate('Pull B')]
    const { result } = renderHook(() => useTemplateSearch(templates))
    expect(result.current.filteredTemplates).toHaveLength(2)
  })

  it('filters templates by name (case-insensitive)', () => {
    const templates = [makeTemplate('Push A'), makeTemplate('Pull B'), makeTemplate('Leg C')]
    const { result } = renderHook(() => useTemplateSearch(templates))

    act(() => {
      result.current.setSearch('push')
    })

    expect(result.current.filteredTemplates).toHaveLength(1)
    expect(result.current.filteredTemplates[0].name).toBe('Push A')
  })

  it('filters templates by description', () => {
    const templates = [
      makeTemplate('Template A', 'upper body focus'),
      makeTemplate('Template B', 'lower body focus'),
    ]
    const { result } = renderHook(() => useTemplateSearch(templates))

    act(() => {
      result.current.setSearch('upper')
    })

    expect(result.current.filteredTemplates).toHaveLength(1)
    expect(result.current.filteredTemplates[0].name).toBe('Template A')
  })

  it('returns empty array when no templates match', () => {
    const templates = [makeTemplate('Push A')]
    const { result } = renderHook(() => useTemplateSearch(templates))

    act(() => {
      result.current.setSearch('squat')
    })

    expect(result.current.filteredTemplates).toHaveLength(0)
  })

  it('trims whitespace from search term', () => {
    const templates = [makeTemplate('Push A')]
    const { result } = renderHook(() => useTemplateSearch(templates))

    act(() => {
      result.current.setSearch('  push  ')
    })

    expect(result.current.filteredTemplates).toHaveLength(1)
  })

  it('hasAnyTemplates is true when templates exist even if filtered result is empty', () => {
    const templates = [makeTemplate('Push A')]
    const { result } = renderHook(() => useTemplateSearch(templates))

    act(() => {
      result.current.setSearch('no match')
    })

    expect(result.current.hasAnyTemplates).toBe(true)
    expect(result.current.filteredTemplates).toHaveLength(0)
  })

  it('hasAnyTemplates is false when templates array is empty', () => {
    const { result } = renderHook(() => useTemplateSearch([]))
    expect(result.current.hasAnyTemplates).toBe(false)
  })
})
