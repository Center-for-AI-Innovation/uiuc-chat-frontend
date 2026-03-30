import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@mantine/dropzone', () => {
  const FullScreen = ({ children, onDrop, onReject, maxSize }: any) => {
    return (
      <div data-testid="dropzone-fullscreen">
        <button
          type="button"
          data-testid="trigger-drop"
          onClick={() =>
            onDrop?.([
              new File(['content'], 'test.pdf', { type: 'application/pdf' }),
            ])
          }
        >
          trigger-drop
        </button>
        <button
          type="button"
          data-testid="trigger-reject"
          onClick={() =>
            onReject?.([
              {
                file: new File(['x'.repeat(20_000_000)], 'huge.pdf', {
                  type: 'application/pdf',
                }),
                errors: [
                  {
                    code: 'file-too-large',
                    message: `File is larger than ${maxSize} bytes`,
                  },
                ],
              },
            ])
          }
        >
          trigger-reject
        </button>
        {children}
      </div>
    )
  }

  const Accept = ({ children }: any) => (
    <div data-testid="dropzone-accept">{children}</div>
  )
  const Idle = ({ children }: any) => (
    <div data-testid="dropzone-idle">{children}</div>
  )

  const Dropzone = ({ children }: any) => <div>{children}</div>
  Dropzone.FullScreen = FullScreen
  Dropzone.Accept = Accept
  Dropzone.Idle = Idle

  return { Dropzone }
})

const mockShowToast = vi.fn()
vi.mock('~/utils/toastUtils', () => ({
  showToast: (...args: any[]) => mockShowToast(...args),
}))

import { FileDropOverlay } from '../FileDropOverlay'

describe('FileDropOverlay', () => {
  it('renders the accept state with correct text and icon', () => {
    render(<FileDropOverlay onFilesDropped={vi.fn()} />)

    expect(screen.getByText('Drop files here')).toBeInTheDocument()
    expect(
      screen.getByText('PDF, DOCX, TXT, images, and more'),
    ).toBeInTheDocument()
  })

  it('calls onFilesDropped when files are dropped', async () => {
    const user = userEvent.setup()
    const onFilesDropped = vi.fn()

    render(<FileDropOverlay onFilesDropped={onFilesDropped} />)

    await user.click(screen.getByTestId('trigger-drop'))

    expect(onFilesDropped).toHaveBeenCalledTimes(1)
    expect(onFilesDropped).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'test.pdf' }),
    ])
  })

  it('shows error toast when files are rejected for being too large', async () => {
    const user = userEvent.setup()

    render(<FileDropOverlay onFilesDropped={vi.fn()} />)

    await user.click(screen.getByTestId('trigger-reject'))

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'File Too Large',
        message: 'One or more files exceed the 15MB size limit.',
        type: 'error',
      }),
    )
  })
})
