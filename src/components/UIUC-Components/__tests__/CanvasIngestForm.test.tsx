import React, { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  createTestQueryClient,
  renderWithProviders,
} from '~/test-utils/renderWithProviders'

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  ),
}))

function Harness({ Component, queryClient }: any) {
  const [files, setFiles] = useState<any[]>([])
  return (
    <div>
      <div data-testid="files">{JSON.stringify(files)}</div>
      <Component
        project_name="CS101"
        setUploadFiles={setFiles}
        queryClient={queryClient}
      />
    </div>
  )
}

describe('CanvasIngestForm', () => {
  it('ingests Canvas content, toggles options, and updates upload state', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const originalSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(
      (fn: any, ms?: any) => {
        if (ms === 8000) {
          fn()
          // @ts-expect-error - minimal timer handle for tests
          return 0
        }
        return originalSetTimeout(fn, ms)
      },
    )

    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/upload',
      query: { course_name: 'CS101' },
    }

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/ingestCanvas')) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const { default: CanvasIngestForm } = await import('../CanvasIngestForm')

    renderWithProviders(
      <Harness Component={CanvasIngestForm} queryClient={queryClient} />,
      {
        queryClient,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(await screen.findByText(/Configure import/i))

    fireEvent.change(
      screen.getByPlaceholderText('https://canvas.illinois.edu/courses/12345'),
      { target: { value: 'https://canvas.illinois.edu/courses/123' } },
    )

    // Toggle one option off and back on to cover both branches.
    await user.click(screen.getByLabelText('Files'))
    await user.click(screen.getByLabelText('Files'))

    const ingestBtn = screen.getByRole('button', {
      name: /Ingest Canvas Content/i,
    })
    await waitFor(() => expect(ingestBtn).toBeEnabled())
    await user.click(ingestBtn)

    await waitFor(() => {
      const filesJson = screen.getByTestId('files').textContent ?? ''
      expect(filesJson).toContain('"status":"complete"')
      expect(filesJson).toContain('https://canvas.illinois.edu/courses/123')
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['documents', 'CS101'] }),
    )
  }, 20_000)

  it('marks an upload as error when ingest returns a non-OK response', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    const originalSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(
      (fn: any, ms?: any) => {
        if (ms === 8000) {
          fn()
          // @ts-expect-error - minimal timer handle for tests
          return 0
        }
        return originalSetTimeout(fn, ms)
      },
    )

    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/upload',
      query: { course_name: 'CS101' },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/ingestCanvas')) {
        return new Response(JSON.stringify({ error: 'nope' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const queryClient = createTestQueryClient()
    const { default: CanvasIngestForm } = await import('../CanvasIngestForm')

    renderWithProviders(
      <Harness Component={CanvasIngestForm} queryClient={queryClient} />,
      {
        queryClient,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(await screen.findByText(/Configure import/i))
    fireEvent.change(
      screen.getByPlaceholderText('https://canvas.illinois.edu/courses/12345'),
      { target: { value: 'https://canvas.illinois.edu/courses/456' } },
    )

    const ingestBtn = screen.getByRole('button', {
      name: /Ingest Canvas Content/i,
    })
    await waitFor(() => expect(ingestBtn).toBeEnabled())
    await user.click(ingestBtn)

    await waitFor(() => {
      const filesJson = screen.getByTestId('files').textContent ?? ''
      expect(filesJson).toContain('"status":"error"')
    })
    expect(alertSpy).toHaveBeenCalled()
  }, 20_000)
})
