import React, { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { createTestQueryClient, renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
}))

vi.mock('axios', () => ({
  default: {
    post: vi.fn(async () => ({ data: { ok: true } })),
  },
}))

function Harness(props: any) {
  const [files, setFiles] = useState<any[]>(props.initialFiles ?? [])
  return (
    <div>
      <div data-testid="files">{JSON.stringify(files)}</div>
      <props.Component
        project_name="CS101"
        setUploadFiles={setFiles}
        queryClient={props.queryClient}
      />
    </div>
  )
}

describe('WebsiteIngestForm', () => {
  it('polls ingest status and marks an uploading base URL as ingesting, adding additional URLs', async () => {
    const setIntervalSpy = vi
      .spyOn(globalThis, 'setInterval')
      .mockImplementation((fn: any) => {
        fn()
        // @ts-expect-error - minimal timer handle for tests
        return 0
      })

    server.use(
      http.get('*/api/materialsTable/docsInProgress*', async () => {
        return HttpResponse.json({
          documents: [
            {
              base_url: 'https://example.com',
              url: 'https://example.com/page1',
              readable_filename: 'page1',
            },
            {
              base_url: 'https://example.com',
              url: 'https://example.com/page2',
              readable_filename: 'page2',
            },
          ],
        })
      }),
      http.get('*/api/materialsTable/successDocs*', async () => {
        return HttpResponse.json({ documents: [] })
      }),
    )

    const { default: WebsiteIngestForm } = await import('../WebsiteIngestForm')
    const queryClient = createTestQueryClient()
    renderWithProviders(
      <Harness
        Component={WebsiteIngestForm}
        queryClient={queryClient}
        initialFiles={[
          {
            name: 'https://example.com',
            status: 'uploading',
            type: 'webscrape',
            url: 'https://example.com',
            isBaseUrl: true,
          },
        ]}
      />,
      { homeContext: { dispatch: vi.fn() }, queryClient },
    )

    expect(setIntervalSpy).toHaveBeenCalled()
    await waitFor(() => {
      const filesJson = screen.getByTestId('files').textContent ?? ''
      expect(filesJson).toContain('"status":"ingesting"')
      expect(filesJson).toContain('https://example.com/page1')
      expect(filesJson).toContain('https://example.com/page2')
    })
  })

  it('polls ingest status and marks an ingesting file as complete when it shows up in success docs', async () => {
    vi.spyOn(globalThis, 'setInterval').mockImplementation((fn: any) => {
      fn()
      // @ts-expect-error - minimal timer handle for tests
      return 0
    })

    server.use(
      http.get('*/api/materialsTable/docsInProgress*', async () => {
        return HttpResponse.json({ documents: [] })
      }),
      http.get('*/api/materialsTable/successDocs*', async () => {
        return HttpResponse.json({
          documents: [{ url: 'https://example.com' }],
        })
      }),
    )

    const { default: WebsiteIngestForm } = await import('../WebsiteIngestForm')
    const queryClient = createTestQueryClient()
    renderWithProviders(
      <Harness
        Component={WebsiteIngestForm}
        queryClient={queryClient}
        initialFiles={[
          {
            name: 'https://example.com',
            status: 'ingesting',
            type: 'webscrape',
            url: 'https://example.com',
            isBaseUrl: true,
          },
        ]}
      />,
      { homeContext: { dispatch: vi.fn() }, queryClient },
    )

    await waitFor(() => {
      const filesJson = screen.getByTestId('files').textContent ?? ''
      expect(filesJson).toContain('"status":"complete"')
    })
  })

  it('opens the dialog and starts ingestion via /api/scrapeWeb', async () => {
    const user = userEvent.setup()
    const axiosMod = await import('axios')

    const originalSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any, ms?: any) => {
      if (ms === 8000) {
        fn()
        // @ts-expect-error - minimal timer handle for tests
        return 0
      }
      return originalSetTimeout(fn, ms)
    })

    const { default: WebsiteIngestForm } = await import('../WebsiteIngestForm')
    const queryClient = createTestQueryClient()
    renderWithProviders(
      <WebsiteIngestForm
        project_name="CS101"
        setUploadFiles={vi.fn() as any}
        queryClient={queryClient}
      />,
      { homeContext: { dispatch: vi.fn() }, queryClient },
    )

    await user.click(screen.getByText(/Configure import/i))
    await user.type(screen.getAllByPlaceholderText('Enter URL...')[0]!, 'https://example.com')
    await user.click(screen.getByRole('button', { name: /Ingest the Website/i }))

    expect((axiosMod as any).default.post).toHaveBeenCalledWith(
      '/api/scrapeWeb',
      expect.objectContaining({
        url: 'https://example.com',
        courseName: 'CS101',
      }),
    )
  })

  it('validates maxUrls and blocks ingest when out of range', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})
    const axiosMod = await import('axios')

    const originalSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any, ms?: any) => {
      if (ms === 8000) {
        fn()
        // @ts-expect-error - minimal timer handle for tests
        return 0
      }
      return originalSetTimeout(fn, ms)
    })

    const { default: WebsiteIngestForm } = await import('../WebsiteIngestForm')
    const queryClient = createTestQueryClient()

    renderWithProviders(
      <WebsiteIngestForm
        project_name="CS101"
        setUploadFiles={vi.fn() as any}
        queryClient={queryClient}
      />,
      { homeContext: { dispatch: vi.fn() }, queryClient },
    )

    await user.click(screen.getByText(/Configure import/i))
    await user.clear(screen.getByPlaceholderText('Default 50'))
    await user.type(screen.getByPlaceholderText('Default 50'), '0')

    expect(
      await screen.findByText(/Max URLs should be between 1 and 500/i),
    ).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Enter URL...'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /Ingest the Website/i }))

    expect(alertSpy).toHaveBeenCalledWith('Invalid max URLs input (1 to 500)')
    expect((axiosMod as any).default.post).not.toHaveBeenCalled()
  })

  it('marks a web ingest as error when scraping fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const axiosMod = await import('axios')
    ;(axiosMod as any).default.post.mockImplementationOnce(async () => {
      throw new Error('scrape failed')
    })

    const originalSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any, ms?: any) => {
      if (ms === 8000) {
        fn()
        // @ts-expect-error - minimal timer handle for tests
        return 0
      }
      return originalSetTimeout(fn, ms)
    })

    const { default: WebsiteIngestForm } = await import('../WebsiteIngestForm')
    const queryClient = createTestQueryClient()

    renderWithProviders(
      <Harness Component={WebsiteIngestForm} queryClient={queryClient} />,
      { homeContext: { dispatch: vi.fn() }, queryClient },
    )

    await user.click(screen.getByText(/Configure import/i))
    await user.clear(screen.getByPlaceholderText('Default 50'))
    await user.type(screen.getByPlaceholderText('Default 50'), '2')
    await user.type(screen.getByPlaceholderText('Enter URL...'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /Ingest the Website/i }))

    await waitFor(() => {
      const filesJson = screen.getByTestId('files').textContent ?? ''
      expect(filesJson).toContain('"status":"error"')
    })
  })
})
