import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchPresignedUrl: vi.fn(async (path: string) => `http://localhost/presigned/${path}`),
  }
})

import { ContextCards } from '../ContextCards'

describe('ContextCards', () => {
  it('returns null when contexts is not an array', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<ContextCards contexts={null as any} />)
    expect(container.firstChild).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('renders nothing for empty contexts array', () => {
    const { container } = render(<ContextCards contexts={[]} />)
    expect(container.textContent).toBe('')
  })

  it('renders cards and resolves presigned URLs (pdf thumbnail + page anchor)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})

    render(
      <ContextCards
        contexts={
          [
            {
              readable_filename: 'Lecture1.pdf',
              pagenumber: '2',
              pagenumber_or_timestamp: '',
              s3_path: 'cs101/lecture1.pdf',
              url: '',
              text: 'snippet',
            } as any,
          ] as any
        }
      />,
    )

    expect(await screen.findByText('Lecture1.pdf')).toBeInTheDocument()

    // Link href should update once fetchPresignedUrl resolves.
    await waitFor(() => {
      const link = screen.getByRole('link') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain(
        'http://localhost/presigned/cs101/lecture1.pdf#page=2',
      )
    })

    // Thumbnail should appear for PDFs.
    expect(
      await screen.findByAltText(/Thumbnail image of the PDF cover page/i),
    ).toBeInTheDocument()
  })
})

