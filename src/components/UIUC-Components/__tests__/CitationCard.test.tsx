import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchPresignedUrl: vi.fn(async () => 'http://localhost/presigned'),
  }
})

describe('CitationCard', () => {
  it('opens a PDF URL with an effective page number', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const { CitationCard } = await import('../CitationCard')

    renderWithProviders(
      <CitationCard
        readable_filename="Lecture.pdf"
        url="https://example.com/lecture.pdf"
        pagenumber_or_timestamp="12"
      />,
    )

    await user.click(screen.getByText('Lecture.pdf'))
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/lecture.pdf#page=12',
      '_blank',
    )
  })

  it('downloads a non-PDF S3 document with a derived extension', async () => {
    const user = userEvent.setup()
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    const apiUtils = await import('~/utils/apiUtils')
    ;(apiUtils as any).fetchPresignedUrl.mockResolvedValueOnce(
      'http://localhost/file',
    )

    const { CitationCard } = await import('../CitationCard')

    renderWithProviders(
      <CitationCard
        readable_filename="Notes"
        course_name="CS101"
        s3_path="cs101/notes.md"
        text="excerpt"
        index={0}
      />,
    )

    await user.click(screen.getByText('Notes'))
    await waitFor(() => expect(anchorClick).toHaveBeenCalled())
  })

  it('renders a web favicon thumbnail and handles image load errors', async () => {
    const { CitationCard } = await import('../CitationCard')

    renderWithProviders(
      <CitationCard
        readable_filename="Website"
        url="https://example.com/page"
        index={1}
      />,
    )

    // Thumbnail image should be present (favicon).
    const img = await screen.findByAltText(/Thumbnail for Website/i)
    fireEvent.error(img)

    // After error, fallback icon header should render.
    expect(screen.getByText('Website')).toBeInTheDocument()
  })
})
