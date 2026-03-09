import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeContextWithMetadata } from '~/test-utils/mocks/chat'

vi.mock('../CitationCard', () => ({
  CitationCard: ({ readable_filename }: any) => (
    <div data-testid="citation-card">
      <a href="#">{readable_filename}</a>
    </div>
  ),
}))

vi.mock('fonts', () => ({
  montserrat_heading: { variable: 'font-mock' },
  montserrat_paragraph: { variable: 'font-mock' },
}))

const makeContexts = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    makeContextWithMetadata({
      readable_filename: `Doc${i + 1}.pdf`,
      s3_path: `s3://bucket/doc${i + 1}.pdf`,
    }),
  )

describe('SourcesSidebar - accessibility', () => {
  const renderSidebar = async (overrides: Record<string, any> = {}) => {
    const defaultProps = {
      isOpen: true,
      contexts: makeContexts(2),
      onClose: vi.fn(),
      courseName: 'CS101',
      ...overrides,
    }
    const SourcesSidebar = (await import('../SourcesSidebar')).default
    return {
      ...renderWithProviders(<SourcesSidebar {...defaultProps} />),
      props: defaultProps,
    }
  }

  it('has role="complementary" and aria-label="Sources sidebar"', async () => {
    await renderSidebar()
    expect(
      screen.getByRole('complementary', { name: /Sources sidebar/i }),
    ).toBeInTheDocument()
  })

  it('close button has aria-label="Close sources sidebar"', async () => {
    await renderSidebar()
    expect(
      screen.getByRole('button', { name: /Close sources sidebar/i }),
    ).toBeInTheDocument()
  })

  it('calls onClose on Escape key press', async () => {
    const { props } = await renderSidebar()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', async () => {
    await renderSidebar({ isOpen: false })
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('renders citation cards for provided contexts', async () => {
    await renderSidebar()
    const cards = screen.getAllByTestId('citation-card')
    expect(cards).toHaveLength(2)
    expect(screen.getByText('Doc1.pdf')).toBeInTheDocument()
    expect(screen.getByText('Doc2.pdf')).toBeInTheDocument()
  })
})
