import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddMeasurementSheet } from './add-measurement-sheet'

// Mock the mutation hook — we test form logic, not API calls
const mutateFn = vi.fn()
vi.mock('./api/use-create-body-measurement', () => ({
  useCreateBodyMeasurement: ({ onSuccess }: { onSuccess?: () => void }) => ({
    mutate: mutateFn,
    isPending: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
}

// ----------------------------------------------------------------
describe('AddMeasurementSheet', () => {
  beforeEach(() => {
    mutateFn.mockReset()
  })

  it('renders the sheet when open is true', () => {
    render(<AddMeasurementSheet {...defaultProps} />)
    expect(screen.getByText('Add measurement')).toBeInTheDocument()
  })

  it('Save button is disabled when form is not dirty', () => {
    render(<AddMeasurementSheet {...defaultProps} />)
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('Save button becomes enabled after entering a weight value', async () => {
    const user = userEvent.setup()
    render(<AddMeasurementSheet {...defaultProps} />)

    const weightInput = screen.getByLabelText(/weight/i)
    await user.clear(weightInput)
    await user.type(weightInput, '80')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
    })
  })

  it('calls createMeasurement on form submit', async () => {
    const user = userEvent.setup()
    render(<AddMeasurementSheet {...defaultProps} />)

    const weightInput = screen.getByLabelText(/weight/i)
    await user.clear(weightInput)
    await user.type(weightInput, '75')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mutateFn).toHaveBeenCalledOnce()
    })
  })

  it('resets form with last measurement values when sheet re-opens', async () => {
    const lastMeasurement = {
      id: '1',
      user_id: 'user-1',
      weight_kg: 82,
      height_cm: null,
      measured_at: '2026-01-15T10:30:00.000Z',
      created_at: '2026-01-15T10:30:00.000Z',
    }

    const { rerender } = render(
      <AddMeasurementSheet open={false} onOpenChange={vi.fn()} lastMeasurement={lastMeasurement} />
    )

    rerender(
      <AddMeasurementSheet open={true} onOpenChange={vi.fn()} lastMeasurement={lastMeasurement} />
    )

    await waitFor(() => {
      const weightInput = screen.getByLabelText(/weight/i) as HTMLInputElement
      expect(weightInput.value).toBe('82')
    })
  })
})
