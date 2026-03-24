import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseListItem } from './exercise-list-item'

// types
import type { IExercise } from '@/app/api/exercises/types'

const makeExercise = (overrides: Partial<IExercise> = {}): IExercise => ({
  id: 'ex-1',
  user_id: 'u1',
  category_id: 'cat-1',
  name: 'Bench Press',
  created_at: '',
  unit_type: 'reps-based',
  ...overrides,
})

const defaultProps = {
  exercise: makeExercise(),
  multiDeleteMode: false,
  isSelected: false,
  isSearchMatch: false,
  onToggleSelection: vi.fn(),
  onDelete: vi.fn(),
}

// ----------------------------------------------------------------
describe('ExerciseListItem', () => {
  it('renders exercise name', () => {
    render(<ExerciseListItem {...defaultProps} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('calls onDelete with exercise id when delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<ExerciseListItem {...defaultProps} onDelete={onDelete} />)

    await user.click(screen.getByRole('button'))
    expect(onDelete).toHaveBeenCalledWith('ex-1')
  })

  it('delete button is enabled and not dimmed by default', () => {
    render(<ExerciseListItem {...defaultProps} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
    expect(screen.getByTestId('exercise-item')).not.toHaveClass('opacity-50')
  })

  it('disables delete button and dims item when isDeleting is true', () => {
    render(<ExerciseListItem {...defaultProps} isDeleting />)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('exercise-item')).toHaveClass('opacity-50')
    expect(screen.getByTestId('exercise-item')).toHaveClass('pointer-events-none')
  })

  it('shows checkbox in multiDeleteMode', () => {
    render(<ExerciseListItem {...defaultProps} multiDeleteMode isSelected={false} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('hides checkbox when multiDeleteMode is false', () => {
    render(<ExerciseListItem {...defaultProps} multiDeleteMode={false} />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
