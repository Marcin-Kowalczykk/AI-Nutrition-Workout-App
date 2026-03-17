import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginatedSection } from './paginated-section'

const makeItems = (count: number) => Array.from({ length: count }, (_, i) => `Item ${i + 1}`)

const renderSection = (items: string[], pageSize = 5) =>
  render(
    <PaginatedSection items={items} initialPageSize={pageSize}>
      {(paginatedItems) => (
        <ul>
          {paginatedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </PaginatedSection>
  )

// ----------------------------------------------------------------
describe('PaginatedSection', () => {
  it('renders the first page of items', () => {
    renderSection(makeItems(10), 5)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 5')).toBeInTheDocument()
    expect(screen.queryByText('Item 6')).not.toBeInTheDocument()
  })

  it('renders all items when count is less than page size', () => {
    renderSection(makeItems(3), 5)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('renders nothing when items array is empty', () => {
    renderSection([], 5)
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
  })

  it('shows next page items after clicking Next', async () => {
    const user = userEvent.setup()
    renderSection(makeItems(10), 5)

    const nextLink = screen.getByRole('link', { name: /next/i })
    await user.click(nextLink)

    expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
    expect(screen.getByText('Item 6')).toBeInTheDocument()
    expect(screen.getByText('Item 10')).toBeInTheDocument()
  })

  it('shows previous page items after clicking Previous', async () => {
    const user = userEvent.setup()
    renderSection(makeItems(10), 5)

    await user.click(screen.getByRole('link', { name: /next/i }))
    await user.click(screen.getByRole('link', { name: /previous/i }))

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.queryByText('Item 6')).not.toBeInTheDocument()
  })

  it('resets to page 1 when items count drops below current page', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <PaginatedSection items={makeItems(10)} initialPageSize={5}>
        {(paginatedItems) => (
          <ul>
            {paginatedItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </PaginatedSection>
    )

    // Go to page 2
    await user.click(screen.getByRole('link', { name: /next/i }))
    expect(screen.getByText('Item 6')).toBeInTheDocument()

    // Reduce items so page 2 no longer exists
    rerender(
      <PaginatedSection items={makeItems(3)} initialPageSize={5}>
        {(paginatedItems) => (
          <ul>
            {paginatedItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </PaginatedSection>
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
  })
})
