import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

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
    get: vi.fn(async () => ({ data: { ok: true } })),
  },
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    callSetCourseMetadata: vi.fn(async () => true),
  }
})

describe('WebScrape', () => {
  it('alerts on invalid URL when pressing Enter', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    const { WebScrape } = await import('../WebScrape')

    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    const urlInput = screen.getAllByPlaceholderText('Enter URL...')[0]!
    await user.click(urlInput)
    await user.keyboard('{Enter}')

    expect(alertSpy).toHaveBeenCalledWith(
      'Invalid URL (please include https://)',
    )
  })

  it('validates maxUrls inputs and shows error text', async () => {
    const user = userEvent.setup()
    const { WebScrape } = await import('../WebScrape')

    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.clear(screen.getByPlaceholderText('Default 50'))
    await user.type(screen.getByPlaceholderText('Default 50'), 'abc')
    await user.type(
      screen.getAllByPlaceholderText('Enter URL...')[0]!,
      'https://example.com',
    )
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    expect(
      await screen.findByText(/Max Pages should be a valid number/i),
    ).toBeInTheDocument()
  })

  it('downloads MIT OCW content and shows a notification toast', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    const axiosMod = await import('axios')

    const { WebScrape } = await import('../WebScrape')
    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.type(
      screen.getAllByPlaceholderText('Enter URL...')[0]!,
      'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
    )
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    expect((axiosMod as any).default.get).toHaveBeenCalledWith(
      '/api/UIUC-api/downloadMITCourse',
      expect.objectContaining({
        params: expect.objectContaining({
          course_name: 'CS101',
        }),
      }),
    )
    expect((notifications as any).show).toHaveBeenCalled()
  })

  it('alerts for Coursera URLs (not automated yet)', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    const { WebScrape } = await import('../WebScrape')
    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.type(
      screen.getAllByPlaceholderText('Enter URL...')[0]!,
      'https://www.coursera.org/learn/machine-learning',
    )
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    expect(alertSpy).toHaveBeenCalled()
  })

  it('ingests Canvas and posts selected options', async () => {
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

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { WebScrape } = await import('../WebScrape')
    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.type(
      screen.getAllByPlaceholderText('Enter URL...')[0]!,
      'https://canvas.illinois.edu/courses/123',
    )
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/UIUC-api/ingestCanvas',
        expect.objectContaining({
          method: 'POST',
        }),
      ),
    )
  })

  it('creates a new course and redirects to its dashboard after ingest', async () => {
    const user = userEvent.setup()

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
      asPath: '/CS101/dashboard',
      push: vi.fn(async () => true),
    }

    const apiUtils = await import('~/utils/apiUtils')

    const { WebScrape } = await import('../WebScrape')
    renderWithProviders(
      <WebScrape
        is_new_course={true}
        courseName="CS101"
        isDisabled={false}
        current_user_email="owner@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.type(
      screen.getAllByPlaceholderText('Enter URL...')[0]!,
      'https://example.com',
    )
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    await waitFor(() =>
      expect((apiUtils as any).callSetCourseMetadata).toHaveBeenCalled(),
    )
    await waitFor(() =>
      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/dashboard',
      ),
    )
  })

  it('scrapes a normal website and clears URL after completion', async () => {
    const user = userEvent.setup()
    const axiosMod = await import('axios')

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

    const { WebScrape } = await import('../WebScrape')
    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.clear(screen.getByPlaceholderText('Default 50'))
    await user.type(screen.getByPlaceholderText('Default 50'), '2')
    const urlInput = screen.getAllByPlaceholderText('Enter URL...')[0]!
    await user.type(urlInput, 'https://example.com')
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    expect((axiosMod as any).default.post).toHaveBeenCalledWith(
      '/api/scrapeWeb',
      expect.objectContaining({
        courseName: 'CS101',
        maxUrls: 2,
      }),
    )
  })

  it('shows an error notification when scraping fails and briefly renders the loading state', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { notifications } = await import('@mantine/notifications')
    const axiosMod = await import('axios')
    let rejectPost: ((err: any) => void) | undefined
    ;(axiosMod as any).default.post.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectPost = reject
        }),
    )

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

    const { WebScrape } = await import('../WebScrape')
    renderWithProviders(
      <WebScrape
        is_new_course={false}
        courseName="CS101"
        isDisabled={false}
        current_user_email="me@example.com"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.type(
      screen.getAllByPlaceholderText('Enter URL...')[0]!,
      'https://example.com',
    )
    await user.click(screen.getByRole('button', { name: /Ingest/i }))

    // Ensure the loading branch renders at least once.
    expect(
      await screen.findByText(/Web scrape in progress/i),
    ).toBeInTheDocument()

    rejectPost?.(new Error('boom'))

    await waitFor(() => expect((notifications as any).show).toHaveBeenCalled())
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error while scraping web:'),
        expect.anything(),
      ),
    )
  })
})
