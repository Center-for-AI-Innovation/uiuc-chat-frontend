import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createTestQueryClient } from '~/test-utils/renderWithProviders'
import type { FileUpload } from '../UploadNotification'

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

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
}))

vi.mock('axios', () => ({ default: { post: vi.fn() } }))

describe('GitHubIngestForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the dialog and ingests a GitHub URL, then updates polling statuses', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    // Avoid the hard-coded 8s wait.
    const nativeSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: any) => {
      return nativeSetTimeout(fn, 0) as any
    }) as any)

    // Polling: capture callback so we can call it with different fetch responses.
    let intervalCallback: (() => Promise<void>) | undefined
    const setIntervalSpy = vi
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(((cb: any, delay?: any) => {
        // GitHubIngestForm polls every 3000ms.
        if (delay === 3000) intervalCallback = cb
        return 42 as any
      }) as any)
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => undefined as any)

    const axios = (await import('axios')).default as any
    axios.post.mockResolvedValueOnce({ data: { ok: true } })

    // First poll: docs in progress (creates additional file entries)
    // Second poll: completed docs (marks additional entries complete)
    let pollStep = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/materialsTable/docsInProgress')) {
        pollStep += 1
        if (pollStep === 1) {
          return new Response(
            JSON.stringify({
              documents: [
                {
                  base_url: 'https://github.com/user/repo',
                  url: 'https://github.com/user/repo/blob/main/README.md',
                  readable_filename: 'README.md',
                },
                {
                  base_url: 'https://github.com/user/repo',
                  url: 'https://github.com/user/repo/blob/main/docs.md',
                  readable_filename: 'docs.md',
                },
              ],
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        return new Response(JSON.stringify({ documents: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (url.includes('/api/materialsTable/successDocs')) {
        if (pollStep <= 1) {
          return new Response(JSON.stringify({ documents: [] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
        return new Response(
          JSON.stringify({
            documents: [
              { url: 'https://github.com/user/repo/blob/main/README.md' },
              { url: 'https://github.com/user/repo/blob/main/docs.md' },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const GitHubIngestForm = (await import('../GitHubIngestForm')).default
    render(
      <GitHubIngestForm
        project_name="CS101"
        setUploadFiles={setUploadFiles as any}
        queryClient={queryClient}
      />,
    )

    await waitFor(() => expect(setIntervalSpy).toHaveBeenCalled())

    await user.click(screen.getByText(/^GitHub$/i))
    expect(await screen.findByText(/Ingest GitHub Website/i)).toBeInTheDocument()

    const urlInput = screen.getByPlaceholderText(/Enter URL/i)
    fireEvent.change(urlInput, {
      target: { value: 'https://github.com/user/repo' },
    })

    const ingestButton = screen.getByRole('button', {
      name: /Ingest the Website/i,
    })
    await waitFor(() => expect(ingestButton).toBeEnabled())

    await user.click(ingestButton)
    await waitFor(() => expect(axios.post).toHaveBeenCalled())

    if (intervalCallback) await intervalCallback()
    if (intervalCallback) await intervalCallback()

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['documents', 'CS101'],
      }),
    )

    // Ensure at least one additional file entry became complete.
    expect(uploads.some((u) => u.status === 'complete')).toBe(true)
  })

  it('shows an error toast and marks the upload errored when scraping fails', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const nativeSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: any) => {
      return nativeSetTimeout(fn, 0) as any
    }) as any)
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((cb: any) => {
      cb()
      return 1 as any
    }) as any)
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => undefined as any)
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ documents: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const axios = (await import('axios')).default as any
    axios.post.mockRejectedValueOnce(new Error('boom'))

    const { notifications } = await import('@mantine/notifications')
    const GitHubIngestForm = (await import('../GitHubIngestForm')).default

    render(
      <GitHubIngestForm
        project_name="CS101"
        setUploadFiles={setUploadFiles as any}
        queryClient={queryClient}
      />,
    )

    await user.click(screen.getByText(/^GitHub$/i))
    expect(await screen.findByText(/Ingest GitHub Website/i)).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText(/Enter URL/i), {
      target: { value: 'https://github.com/user/repo' },
    })
    const ingestButton = screen.getByRole('button', { name: /Ingest the Website/i })
    await waitFor(() => expect(ingestButton).toBeEnabled())
    await user.click(ingestButton)

    await waitFor(() => expect((notifications as any).show).toHaveBeenCalled())
    expect(uploads.some((u) => u.status === 'error')).toBe(true)
  })
})
