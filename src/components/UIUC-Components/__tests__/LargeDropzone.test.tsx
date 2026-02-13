import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import userEvent from '@testing-library/user-event'

import type { FileUpload } from '../UploadNotification'

vi.mock('@mantine/hooks', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useMediaQuery: () => false,
  }
})

vi.mock('@mantine/dropzone', () => {
  const Dropzone = ({ children, onDrop, loading }: any) => {
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            onDrop?.([
              new File(['hello'], 'My File.pdf', { type: 'application/pdf' }),
            ])
          }
        >
          trigger-drop
        </button>
        <div data-testid="dropzone-loading">{String(!!loading)}</div>
        {children}
      </div>
    )
  }
  const Accept = ({ children }: any) => <div>{children}</div>
  Accept.displayName = 'Dropzone.Accept'
  Dropzone.Accept = Accept

  const Reject = ({ children }: any) => <div>{children}</div>
  Reject.displayName = 'Dropzone.Reject'
  Dropzone.Reject = Reject

  const Idle = ({ children }: any) => <div>{children}</div>
  Idle.displayName = 'Dropzone.Idle'
  Dropzone.Idle = Idle
  return { Dropzone }
})

vi.mock('@/hooks/__internal__/setCourseMetadata', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

vi.mock('uuid', () => ({ v4: () => 'uuid-1' }))

describe('LargeDropzone', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the disabled state message', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    renderWithProviders(
      <LargeDropzone
        courseName="CS101"
        current_user_email="me@example.com"
        isDisabled
        courseMetadata={{} as any}
        is_new_course={false}
        setUploadFiles={vi.fn() as any}
        auth={{} as any}
      />,
    )

    expect(
      screen.getByText(/Enter an available project name above/i),
    ).toBeInTheDocument()
  })

  it('uploads + ingests files for a new course and redirects to dashboard', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')
    const { callSetCourseMetadata } = await import(
      '@/hooks/__internal__/setCourseMetadata'
    )

    const push = vi.fn(async () => {})
    const reload = vi.fn()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard', push, reload }

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    let intervalCallback: (() => Promise<void>) | undefined
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((cb: any) => {
      intervalCallback = cb
      return 123 as any
    }) as any)
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(
      () => undefined as any,
    )

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: any, init?: any) => {
        const url = String(input?.url ?? input)

        if (url.includes('/api/UIUC-api/uploadToS3')) {
          return new Response(
            JSON.stringify({
              post: {
                url: 'http://localhost/upload',
                fields: { key: 'k', policy: 'p', 'x-amz-signature': 'sig' },
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        if (url === 'http://localhost/upload') {
          return new Response('', { status: 200 })
        }
        if (url.includes('/api/UIUC-api/ingest')) {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
        if (url.includes('/api/materialsTable/docsInProgress')) {
          return new Response(
            JSON.stringify({
              documents: uploads.map((u) => ({ readable_filename: u.name })),
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        if (url.includes('/api/materialsTable/successDocs')) {
          return new Response(
            JSON.stringify({
              documents: uploads.map((u) => ({ readable_filename: u.name })),
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }

        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      },
    )

    renderWithProviders(
      <LargeDropzone
        courseName="CS101"
        current_user_email="me@example.com"
        redirect_to_gpt_4
        courseMetadata={{ course_owner: 'me@example.com' } as any}
        is_new_course
        setUploadFiles={setUploadFiles as any}
        auth={{ isAuthenticated: true } as any}
      />,
    )

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    await waitFor(() => expect(callSetCourseMetadata).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(push).toHaveBeenCalledWith('/CS101/dashboard')

    // Trigger one poll to exercise the status mapping code paths.
    if (intervalCallback) await intervalCallback()

    expect(uploads.length).toBeGreaterThan(0)
    expect(uploads[0].status).toMatch(/uploading|ingesting|complete/)
  }, 20000)
})
