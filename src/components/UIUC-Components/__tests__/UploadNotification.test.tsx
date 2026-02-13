import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  }
})

const useQueryMock = vi.fn()
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    useQuery: (...args: any[]) => useQueryMock(...args),
  }
})

import UploadNotification, { type FileUpload } from '../UploadNotification'

describe('UploadNotification', () => {
  it('renders file list, toggles minimize, and closes', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    useQueryMock.mockReturnValue({
      data: { final_docs: [], total_count: 0, recent_fail_count: 0 },
    })

    const files: FileUpload[] = [
      { name: 'a.pdf', status: 'uploading', type: 'document' },
      { name: 'b.docx', status: 'ingesting', type: 'document' },
      { name: 'c.ts', status: 'complete', type: 'document' },
      { name: 'https://example.com', status: 'uploading', type: 'webscrape' },
    ]

    renderWithProviders(
      <UploadNotification
        files={files}
        onClose={onClose}
        projectName="CS101"
      />,
    )

    expect(
      await screen.findByText(/Processing 4 documents/i),
    ).toBeInTheDocument()
    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.getByText('b.docx')).toBeInTheDocument()
    expect(screen.getByText('c.ts')).toBeInTheDocument()

    // Minimize hides list
    await user.click(screen.getByRole('button', { name: /Minimize uploads/i }))
    await waitFor(() => {
      expect(screen.queryByText('a.pdf')).not.toBeInTheDocument()
    })

    // Restore shows list
    await user.click(screen.getByRole('button', { name: /Expand uploads/i }))
    expect(await screen.findByText('a.pdf')).toBeInTheDocument()

    // Close button
    await user.click(screen.getByRole('button', { name: /Close uploads/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('maps failed documents to error state and auto-closes when done', async () => {
    const onClose = vi.fn()

    useQueryMock.mockReturnValue({
      data: {
        final_docs: [
          {
            id: 1,
            course_name: 'CS101',
            readable_filename: 'bad.pdf',
            s3_path: 's3',
            url: 'u',
            base_url: '',
            created_at: new Date().toISOString(),
            error: 'boom',
          },
        ],
        total_count: 1,
        recent_fail_count: 1,
      },
    })

    const files: FileUpload[] = [
      { name: 'bad.pdf', status: 'complete', type: 'document' },
      { name: 'ok.pdf', status: 'complete', type: 'document' },
    ]

    renderWithProviders(
      <UploadNotification
        files={files}
        onClose={onClose}
        projectName="CS101"
      />,
    )

    // Failed doc should be shown as error
    expect(
      await screen.findByText(/Processing 2 documents/i),
    ).toBeInTheDocument()
    expect(screen.getByText('bad.pdf')).toBeInTheDocument()
    expect(screen.getAllByText(/Upload failed/i).length).toBeGreaterThan(0)

    await new Promise((r) => setTimeout(r, 5100))
    expect(onClose).toHaveBeenCalled()
  }, 12_000)
})
