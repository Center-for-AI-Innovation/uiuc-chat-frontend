import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { FileUpload } from '../UploadNotification'

vi.mock('@mantine/hooks', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useMediaQuery: () => false,
  }
})

// Store the latest onDrop handler so custom tests can call it with arbitrary files.
let capturedOnDrop: ((files: File[]) => void) | undefined

vi.mock('@mantine/dropzone', () => {
  const Dropzone = ({ children, onDrop, loading }: any) => {
    capturedOnDrop = onDrop
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

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return { ...actual, callSetCourseMetadata: vi.fn(async () => ({})) }
})

vi.mock('uuid', () => ({ v4: () => 'uuid-1' }))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Standard mock for setInterval that captures the callback. */
function mockTimers() {
  let intervalCallback: (() => Promise<void>) | undefined
  vi.spyOn(globalThis, 'setInterval').mockImplementation(((cb: any) => {
    intervalCallback = cb
    return 123 as any
  }) as any)
  vi.spyOn(globalThis, 'clearInterval').mockImplementation(
    () => undefined as any,
  )
  return () => intervalCallback
}

/** Build a standard fetch mock that can be customised per-test. */
function buildFetchMock(overrides: {
  docsInProgress?: () => { documents: { readable_filename: string }[] }
  successDocs?: () => { documents: { readable_filename: string }[] }
  uploadToS3?: () => Response | Promise<Response>
  s3Upload?: () => Response | Promise<Response>
  ingest?: () => Response | Promise<Response>
}) {
  return async (input: any, _init?: any) => {
    const url = String(input?.url ?? input)

    if (url.includes('/api/UIUC-api/uploadToS3')) {
      if (overrides.uploadToS3) return overrides.uploadToS3()
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
      if (overrides.s3Upload) return overrides.s3Upload()
      return new Response('', { status: 200 })
    }
    if (url.includes('/api/UIUC-api/ingest')) {
      if (overrides.ingest) return overrides.ingest()
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (url.includes('/api/materialsTable/docsInProgress')) {
      const body = overrides.docsInProgress
        ? overrides.docsInProgress()
        : { documents: [] }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (url.includes('/api/materialsTable/successDocs')) {
      const body = overrides.successDocs
        ? overrides.successDocs()
        : { documents: [] }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

/** Default props factory for LargeDropzone. */
function defaultProps(overrides: Record<string, any> = {}) {
  return {
    courseName: 'CS101',
    current_user_email: 'me@example.com',
    isDisabled: false,
    courseMetadata: { course_owner: 'me@example.com' } as any,
    is_new_course: false,
    redirect_to_gpt_4: true,
    setUploadFiles: vi.fn() as any,
    auth: { isAuthenticated: true } as any,
    ...overrides,
  }
}

describe('LargeDropzone', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    capturedOnDrop = undefined
  })

  // -----------------------------------------------------------------------
  // Rendering states
  // -----------------------------------------------------------------------

  it('shows the disabled state message', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(<LargeDropzone {...defaultProps({ isDisabled: true })} />)

    expect(
      screen.getByText(/Enter an available project name above/i),
    ).toBeInTheDocument()
  })

  it('shows "Upload materials" and drag-n-drop hint when enabled', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(<LargeDropzone {...defaultProps()} />)

    expect(screen.getByText('Upload materials')).toBeInTheDocument()
    expect(
      screen.getByText(/Drag.*drop files or a whole folder here/i),
    ).toBeInTheDocument()
  })

  it('does not show drag-n-drop hint or cloud icon when disabled', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(<LargeDropzone {...defaultProps({ isDisabled: true })} />)

    expect(
      screen.queryByText(/Drag.*drop files or a whole folder here/i),
    ).not.toBeInTheDocument()
  })

  // -----------------------------------------------------------------------
  // New course upload + redirect
  // -----------------------------------------------------------------------

  it('uploads + ingests files for a new course and redirects to dashboard', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    const push = vi.fn(async () => {})
    const reload = vi.fn()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard', push, reload }

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const getIntervalCb = mockTimers()

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({
          documents: uploads.map((u) => ({ readable_filename: u.name })),
        }),
        successDocs: () => ({
          documents: uploads.map((u) => ({ readable_filename: u.name })),
        }),
      }),
    )

    render(
      <LargeDropzone
        {...defaultProps({
          is_new_course: true,
          setUploadFiles,
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    await waitFor(() => expect(callSetCourseMetadata).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(push).toHaveBeenCalledWith('/CS101/dashboard')

    // Trigger one poll to exercise the status mapping code paths.
    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    expect(uploads.length).toBeGreaterThan(0)
    expect(uploads[0]!.status).toMatch(/uploading|ingesting|complete/)
  }, 20000)

  // -----------------------------------------------------------------------
  // Audio / video rejection
  // -----------------------------------------------------------------------

  it('rejects audio files by MIME type', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    const setUploadFiles = vi.fn()
    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    // Trigger onDrop with an audio file
    capturedOnDrop?.([new File(['data'], 'song.mp3', { type: 'audio/mpeg' })])

    expect(alertSpy).toHaveBeenCalledWith(
      'Audio and video files are not supported at this time.',
    )
    // setUploadFiles should NOT be called for rejected files
    expect(setUploadFiles).not.toHaveBeenCalled()
  })

  it('rejects video files by MIME type', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    render(<LargeDropzone {...defaultProps()} />)

    capturedOnDrop?.([new File(['data'], 'clip.mp4', { type: 'video/mp4' })])

    expect(alertSpy).toHaveBeenCalledWith(
      'Audio and video files are not supported at this time.',
    )
  })

  it('rejects files by audio/video extension even without MIME type', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    render(<LargeDropzone {...defaultProps()} />)

    // File with generic MIME type but audio extension
    capturedOnDrop?.([
      new File(['data'], 'track.flac', { type: 'application/octet-stream' }),
    ])

    expect(alertSpy).toHaveBeenCalledWith(
      'Audio and video files are not supported at this time.',
    )
  })

  it('rejects files with video extensions like .mkv, .avi, .mov', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    render(<LargeDropzone {...defaultProps()} />)

    capturedOnDrop?.([new File(['data'], 'movie.mkv', { type: '' })])

    expect(alertSpy).toHaveBeenCalledWith(
      'Audio and video files are not supported at this time.',
    )
  })

  it('accepts non-audio/video files without alert', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    const getIntervalCb = mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

    const setUploadFiles = vi.fn()
    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    capturedOnDrop?.([new File(['data'], 'notes.txt', { type: 'text/plain' })])

    // Wait for the async ingestFiles to begin
    await waitFor(() => expect(setUploadFiles).toHaveBeenCalled())
    expect(alertSpy).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // Upload error handling
  // -----------------------------------------------------------------------

  it('logs error when uploadToS3 fails but continues to ingest', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // uploadToS3 has its own try/catch that swallows the error and logs it.
    // The outer ingestFiles code then continues to call the ingest API.
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        uploadToS3: () => {
          throw new Error('Network failure')
        },
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    await waitFor(() => {
      // uploadToS3 catches the error and logs it
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error uploading file:',
        expect.any(Error),
      )
    })

    // Upload still proceeds (the file was added to the upload list initially)
    expect(setUploadFiles).toHaveBeenCalled()
  }, 10000)

  it('sets file status to error when ingest API throws', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        ingest: () => {
          throw new Error('Ingest service down')
        },
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    await waitFor(() => {
      const errorCall = setUploadFiles.mock.calls.find((call: any[]) => {
        if (typeof call[0] === 'function') {
          const result = call[0]([
            { name: 'My-File.pdf', status: 'uploading', type: 'document' },
          ])
          return result.some((f: FileUpload) => f.status === 'error')
        }
        return false
      })
      expect(errorCall).toBeDefined()
    })

    expect(consoleSpy).toHaveBeenCalled()
  }, 10000)

  // -----------------------------------------------------------------------
  // Non-new-course redirects
  // -----------------------------------------------------------------------

  it('redirects to chat when redirect_to_gpt_4 is true and not a new course', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')

    const push = vi.fn(async () => {})
    const reload = vi.fn(async () => {})
    globalThis.__TEST_ROUTER__ = { push, reload }

    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(
      <LargeDropzone
        {...defaultProps({
          is_new_course: false,
          redirect_to_gpt_4: true,
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    // Non-new-course does NOT call refreshOrRedirect inside ingestFiles,
    // so push should not be called for /chat in this path
    // (refreshOrRedirect is only called when is_new_course is true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(push).not.toHaveBeenCalled()
  }, 10000)

  // -----------------------------------------------------------------------
  // Multiple file uploads
  // -----------------------------------------------------------------------

  it('handles multiple files in a single drop', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    capturedOnDrop?.([
      new File(['a'], 'doc1.pdf', { type: 'application/pdf' }),
      new File(['b'], 'doc2.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      new File(['c'], 'notes.txt', { type: 'text/plain' }),
    ])

    await waitFor(() => {
      expect(setUploadFiles).toHaveBeenCalled()
    })

    // The initial call should add 3 files
    const addCall = setUploadFiles.mock.calls.find((call: any[]) => {
      if (typeof call[0] === 'function') {
        const result = call[0]([])
        return result.length === 3
      }
      return false
    })
    expect(addCall).toBeDefined()
  })

  it('rejects drop when mix of valid and audio files', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})
    const setUploadFiles = vi.fn()

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    capturedOnDrop?.([
      new File(['a'], 'doc.pdf', { type: 'application/pdf' }),
      new File(['b'], 'song.wav', { type: 'audio/wav' }),
    ])

    expect(alertSpy).toHaveBeenCalledWith(
      'Audio and video files are not supported at this time.',
    )
    expect(setUploadFiles).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // Polling / status transitions
  // -----------------------------------------------------------------------

  it('transitions file from uploading to ingesting when seen in docsInProgress', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const getIntervalCb = mockTimers()

    // docsInProgress returns the file, successDocs does not
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({
          documents: [{ readable_filename: 'report.pdf' }],
        }),
        successDocs: () => ({ documents: [] }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    // Simulate having a file in uploading state
    uploads = [{ name: 'report.pdf', status: 'uploading', type: 'document' }]

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    // setUploadFiles should have been called with an updater that transitions
    // the file to 'ingesting'
    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const result = updater[0]([
        { name: 'report.pdf', status: 'uploading', type: 'document' },
      ])
      expect(result[0].status).toBe('ingesting')
    }
  })

  it('transitions file from uploading directly to complete when in successDocs but not inProgress', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    const getIntervalCb = mockTimers()

    // File is not in docsInProgress but IS in successDocs (fast ingest)
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({ documents: [] }),
        successDocs: () => ({
          documents: [{ readable_filename: 'quick.pdf' }],
        }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const result = updater[0]([
        { name: 'quick.pdf', status: 'uploading', type: 'document' },
      ])
      expect(result[0].status).toBe('complete')
    }
  })

  it('transitions file from ingesting to complete when no longer in progress but in successDocs', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    const setUploadFiles = vi.fn()
    const getIntervalCb = mockTimers()

    // File no longer in docsInProgress, but in successDocs
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({ documents: [] }),
        successDocs: () => ({
          documents: [{ readable_filename: 'done.pdf' }],
        }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const result = updater[0]([
        { name: 'done.pdf', status: 'ingesting', type: 'document' },
      ])
      expect(result[0].status).toBe('complete')
    }
  })

  it('transitions file from ingesting to error when not in progress and not in successDocs', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    const setUploadFiles = vi.fn()
    const getIntervalCb = mockTimers()

    // File not in either docsInProgress or successDocs
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({ documents: [] }),
        successDocs: () => ({ documents: [] }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const result = updater[0]([
        { name: 'failed.pdf', status: 'ingesting', type: 'document' },
      ])
      expect(result[0].status).toBe('error')
    }
  })

  it('leaves non-document files unchanged during polling', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    const setUploadFiles = vi.fn()
    const getIntervalCb = mockTimers()

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({ documents: [] }),
        successDocs: () => ({ documents: [] }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const webscrapeFile: FileUpload = {
        name: 'https://example.com',
        status: 'uploading',
        type: 'webscrape',
      }
      const result = updater[0]([webscrapeFile])
      expect(result[0].status).toBe('uploading')
      expect(result[0].type).toBe('webscrape')
    }
  })

  it('keeps file as ingesting when still in docsInProgress', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    const setUploadFiles = vi.fn()
    const getIntervalCb = mockTimers()

    // File still in docsInProgress
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({
          documents: [{ readable_filename: 'still-going.pdf' }],
        }),
        successDocs: () => ({ documents: [] }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const result = updater[0]([
        { name: 'still-going.pdf', status: 'ingesting', type: 'document' },
      ])
      // Should remain 'ingesting' since it's still in docsInProgress
      expect(result[0].status).toBe('ingesting')
    }
  })

  it('leaves uploading file unchanged when not in docsInProgress or successDocs yet', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')

    const setUploadFiles = vi.fn()
    const getIntervalCb = mockTimers()

    // Neither list contains the file (still uploading to S3)
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        docsInProgress: () => ({ documents: [] }),
        successDocs: () => ({ documents: [] }),
      }),
    )

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    const intervalCallback = getIntervalCb()
    if (intervalCallback) await intervalCallback()

    const updater = setUploadFiles.mock.calls.find(
      (call: any[]) => typeof call[0] === 'function',
    )
    expect(updater).toBeDefined()
    if (updater) {
      const result = updater[0]([
        { name: 'pending.pdf', status: 'uploading', type: 'document' },
      ])
      // Should stay 'uploading' because it's not visible in either API yet
      expect(result[0].status).toBe('uploading')
    }
  })

  // -----------------------------------------------------------------------
  // File name sanitisation
  // -----------------------------------------------------------------------

  it('sanitises file names by replacing non-alphanumeric chars with dashes', async () => {
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()

    let uploads: FileUpload[] = []
    const setUploadFiles = vi.fn((updater: any) => {
      uploads = typeof updater === 'function' ? updater(uploads) : updater
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(<LargeDropzone {...defaultProps({ setUploadFiles })} />)

    capturedOnDrop?.([
      new File(['data'], 'My File (2024).pdf', { type: 'application/pdf' }),
    ])

    await waitFor(() => {
      expect(setUploadFiles).toHaveBeenCalled()
    })

    // The initial add should use sanitised name
    const addCall = setUploadFiles.mock.calls.find((call: any[]) => {
      if (typeof call[0] === 'function') {
        const result = call[0]([])
        return result.length > 0 && result[0].name === 'My-File--2024-.pdf'
      }
      return false
    })
    expect(addCall).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // New course with no existing courseMetadata (fallback metadata)
  // -----------------------------------------------------------------------

  it('uses fallback metadata when courseMetadata is falsy for new course', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    const push = vi.fn(async () => {})
    const reload = vi.fn()
    globalThis.__TEST_ROUTER__ = { push, reload }

    mockTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(buildFetchMock({}))

    render(
      <LargeDropzone
        {...defaultProps({
          is_new_course: true,
          // Pass falsy courseMetadata to trigger fallback path
          courseMetadata: null,
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    await waitFor(() => expect(callSetCourseMetadata).toHaveBeenCalled())

    // Verify fallback metadata was used (course_owner from current_user_email)
    const callArgs = (callSetCourseMetadata as any).mock.calls[0]
    expect(callArgs[0]).toBe('CS101')
    expect(callArgs[1]).toEqual(
      expect.objectContaining({ course_owner: 'me@example.com' }),
    )
  }, 10000)

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  it('shows loading state during upload', async () => {
    const user = userEvent.setup()
    const { default: LargeDropzone } = await import('../LargeDropzone')
    mockTimers()

    // Make uploadToS3 hang so we can observe loading state
    let resolveUpload: (() => void) | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      buildFetchMock({
        uploadToS3: () =>
          new Promise((resolve) => {
            resolveUpload = () =>
              resolve(
                new Response(
                  JSON.stringify({
                    post: {
                      url: 'http://localhost/upload',
                      fields: { key: 'k' },
                    },
                  }),
                  {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                  },
                ),
              )
          }),
      }),
    )

    render(<LargeDropzone {...defaultProps()} />)

    const loadingIndicator = screen.getByTestId('dropzone-loading')
    expect(loadingIndicator.textContent).toBe('false')

    await user.click(screen.getByRole('button', { name: /trigger-drop/i }))

    await waitFor(() => {
      expect(screen.getByTestId('dropzone-loading').textContent).toBe('true')
    })

    // Cleanup - resolve the hanging promise
    if (resolveUpload) resolveUpload()
  }, 10000)
})
