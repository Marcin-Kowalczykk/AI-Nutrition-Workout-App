// libs
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

// components
import { ConfirmModal } from './confirm-modal'

// utils
import { render, screen } from '../../../tests/test-utils'

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Usuń trening',
  description: 'Czy na pewno chcesz usunąć ten trening?',
  onConfirm: vi.fn(),
}

describe('ConfirmModal', () => {
  it('renders title and description when open', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Usuń trening')).toBeInTheDocument()
    expect(screen.getByText('Czy na pewno chcesz usunąć ten trening?')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ConfirmModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Usuń trening')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<ConfirmModal {...defaultProps} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onCancel instead of onOpenChange when onCancel is provided', async () => {
    const onOpenChange = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmModal {...defaultProps} onOpenChange={onOpenChange} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('disables both buttons and hides close button while isPending', () => {
    render(<ConfirmModal {...defaultProps} isPending />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('shows custom labels', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Usuń" cancelLabel="Anuluj" />)
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument()
  })
})
