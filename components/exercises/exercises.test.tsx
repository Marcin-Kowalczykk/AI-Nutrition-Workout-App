import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Exercises } from './exercises'

// --- mock API hooks ---

const mutateFn = vi.fn()

vi.mock('./api/use-list-categories', () => ({
  useListCategories: () => ({
    data: {
      categories: [
        { id: 'cat-1', user_id: 'u1', name: 'Chest', created_at: '' },
        { id: 'cat-2', user_id: 'u1', name: 'Back', created_at: '' },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock('./api/use-list-exercises', () => ({
  useListExercises: () => ({
    data: {
      exercises: [
        { id: 'ex-1', user_id: 'u1', category_id: 'cat-1', name: 'Bench Press', created_at: '', unit_type: 'reps-based' },
        { id: 'ex-2', user_id: 'u1', category_id: 'cat-2', name: 'Pull-up', created_at: '', unit_type: 'reps-based' },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock('./api/use-create-category', () => ({
  useCreateCategory: () => ({ mutate: mutateFn, isPending: false }),
}))

vi.mock('./api/use-create-exercise', () => ({
  useCreateExercise: () => ({ mutate: mutateFn, isPending: false }),
}))

vi.mock('./api/use-delete-categories', () => ({
  useDeleteCategories: () => ({ mutate: mutateFn, isPending: false }),
}))

vi.mock('./api/use-delete-exercises', () => ({
  useDeleteExercises: () => ({ mutate: mutateFn, isPending: false }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

// ----------------------------------------------------------------
describe('Exercises', () => {
  beforeEach(() => {
    mutateFn.mockReset()
  })

  it('renders both categories', () => {
    render(<Exercises />)
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('filters categories by search term', async () => {
    const user = userEvent.setup()
    render(<Exercises />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'chest')

    await waitFor(() => {
      expect(screen.getByText('Chest')).toBeInTheDocument()
      expect(screen.queryByText('Back')).not.toBeInTheDocument()
    })
  })

  it('shows all categories when search is cleared', async () => {
    const user = userEvent.setup()
    render(<Exercises />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'chest')
    await user.clear(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Chest')).toBeInTheDocument()
      expect(screen.getByText('Back')).toBeInTheDocument()
    })
  })

  it('Add category button is disabled when input is empty', () => {
    render(<Exercises />)
    expect(screen.getByRole('button', { name: /add category/i })).toBeDisabled()
  })

  it('Add category button is enabled when input has text', async () => {
    const user = userEvent.setup()
    render(<Exercises />)

    const input = screen.getByPlaceholderText(/new category name/i)
    await user.type(input, 'Legs')

    expect(screen.getByRole('button', { name: /add category/i })).not.toBeDisabled()
  })

  it('calls createCategory mutation when Add category is clicked', async () => {
    const user = userEvent.setup()
    render(<Exercises />)

    const input = screen.getByPlaceholderText(/new category name/i)
    await user.type(input, 'Legs')
    await user.click(screen.getByRole('button', { name: /add category/i }))

    expect(mutateFn).toHaveBeenCalledWith({ name: 'Legs' })
  })

  it('shows multi-delete button when toggled on', async () => {
    const user = userEvent.setup()
    render(<Exercises />)

    await user.click(screen.getByRole('button', { name: /show multi-delete/i }))

    expect(screen.getByRole('button', { name: /hide multi-delete/i })).toBeInTheDocument()
  })
})
