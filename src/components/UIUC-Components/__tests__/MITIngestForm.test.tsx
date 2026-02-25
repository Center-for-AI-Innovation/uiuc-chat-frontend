import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const dialogState = vi.hoisted(() => ({
  open: false,
  setOpen: (v: boolean) => {
    dialogState.open = v
  },
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ layout: _layout, ...props }: any) => <div {...props} />,
  },
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(async () => ({ data: { ok: true } })),
  },
}))

vi.mock('../../Dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => {
    dialogState.open = open
    dialogState.setOpen = onOpenChange
    return <div>{children}</div>
  },
  DialogTrigger: ({ children }: any) => (
    <button type="button" onClick={() => dialogState.setOpen(true)}>
      {children}
    </button>
  ),
  DialogContent: ({ children }: any) =>
    dialogState.open ? (
      <div>
        <button
          type="button"
          aria-label="close-dialog"
          onClick={() => dialogState.setOpen(false)}
        >
          close
        </button>
        {children}
      </div>
    ) : null,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

describe('MITIngestForm', () => {
  it('opens the dialog and ingests a valid MIT OCW URL to completion', async () => {
    const user = userEvent.setup()
    const axiosMod = await import('axios')

    let uploads: any[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const { default: MITIngestForm } = await import('../MITIngestForm')
    render(
      <MITIngestForm
        project_name="CS101"
        setUploadFiles={setUploadFiles as any}
      />,
    )

    await user.click(screen.getByRole('button', { name: /MIT Course/i }))
    await user.type(
      screen.getByPlaceholderText(/Enter URL/i),
      'https://ocw.mit.edu/courses/test-course',
    )
    await user.click(screen.getByRole('button', { name: /Ingest MIT Course/i }))

    await waitFor(() =>
      expect((axiosMod.default as any).get).toHaveBeenCalled(),
    )
    expect(uploads.some((f) => f.status === 'complete')).toBe(true)
  })

  it('marks upload as error when MIT download endpoint returns null', async () => {
    const user = userEvent.setup()
    const axiosMod = await import('axios')
    ;(axiosMod.default as any).get.mockResolvedValueOnce({ data: null })

    let uploads: any[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const { default: MITIngestForm } = await import('../MITIngestForm')
    render(
      <MITIngestForm
        project_name="CS101"
        setUploadFiles={setUploadFiles as any}
      />,
    )

    await user.click(screen.getByRole('button', { name: /MIT Course/i }))
    await user.type(
      screen.getByPlaceholderText(/Enter URL/i),
      'https://ocw.mit.edu/courses/error-case',
    )
    await user.click(screen.getByRole('button', { name: /Ingest MIT Course/i }))

    await waitFor(() =>
      expect(uploads.some((f) => f.status === 'error')).toBe(true),
    )
  })

  it('resets fields when dialog closes and reopens', async () => {
    const user = userEvent.setup()
    const { default: MITIngestForm } = await import('../MITIngestForm')

    const setUploadFiles = vi.fn()
    render(
      <MITIngestForm
        project_name="CS101"
        setUploadFiles={setUploadFiles as any}
      />,
    )

    await user.click(screen.getByRole('button', { name: /MIT Course/i }))
    const input = screen.getByPlaceholderText(/Enter URL/i)
    await user.type(input, 'https://ocw.mit.edu/courses/reset-me')
    expect((input as HTMLInputElement).value).toContain('reset-me')

    await user.click(screen.getByRole('button', { name: /close-dialog/i }))
    await user.click(screen.getByRole('button', { name: /MIT Course/i }))

    expect(
      (screen.getByPlaceholderText(/Enter URL/i) as HTMLInputElement).value,
    ).toBe('')
    expect(
      screen.getByRole('button', { name: /Ingest MIT Course/i }),
    ).toBeDisabled()
  })
})
