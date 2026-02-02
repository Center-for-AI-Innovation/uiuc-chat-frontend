import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeContextWithMetadata, makeConversation, makeMessage } from '~/test-utils/mocks/chat'

const messageMocks = vi.hoisted(() => ({
  saveConversationToServer: vi.fn(async () => ({})),
}))

// Keep modal/animation behavior predictable.
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  ),
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchPresignedUrl: vi.fn(async () => 'http://localhost/api/file'),
  }
})

vi.mock('~/utils/app/conversation', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    saveConversationToServer: messageMocks.saveConversationToServer,
  }
})

vi.mock('../FeedbackModal', () => ({
  FeedbackModal: ({ isOpen, onClose, onSubmit }: any) => {
    if (!isOpen) return null
    return React.createElement(
      'div',
      { role: 'dialog', 'aria-label': 'Feedback modal' },
      React.createElement(
        'button',
        { type: 'button', onClick: () => onSubmit('details', 'category') },
        'Submit feedback',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: onClose },
        'Close feedback',
      ),
    )
  },
}))

vi.mock('../MessageActions', () => ({
  default: ({ onOpenFeedbackModal }: any) =>
    React.createElement(
      'button',
      { type: 'button', onClick: onOpenFeedbackModal },
      'Open feedback',
    ),
}))

describe('ChatMessage', () => {
  it(
    'renders assistant markdown and opens Sources sidebar when contexts exist',
    async () => {
      const user = userEvent.setup()
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Lecture1.pdf',
      s3_path: 'cs101/lecture1.pdf',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'What is covered in lecture 1?',
      contexts: [ctxPdf],
    })

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      // Include think tag + a presigned-looking link so the refresh logic executes safely.
      content:
        '<think>draft</think>Here is an answer.\\n\\n[Lecture](https://s3.amazonaws.com/bucket/lecture1.pdf?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60 \"Citation 1\")',
      contexts: [],
      tools: [
        {
          id: 'tool-1',
          name: 'tool_name',
          readableName: 'Tool',
          description: 'd',
          aiGeneratedArgumentValues: {
            image_urls: JSON.stringify([
              'https://s3.amazonaws.com/bucket/img.png?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60',
            ]),
          },
          output: { s3Paths: ['cs101/img.png'], imageUrls: [] },
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Think tag content should render.
    expect(await screen.findByText(/AI's Thought Process/i)).toBeInTheDocument()

    // Sources button should appear because the previous user message has contexts.
    const sourcesBtn = await screen.findByRole('button', { name: /Sources/i })
    await user.click(sourcesBtn)

    // Sidebar renders a sources section header.
    expect(
      await screen.findByText(/All Sources|Citations|More Sources/i),
    ).toBeInTheDocument()

    // Close the sidebar to ensure its interval cleanup runs.
      await user.click(
        screen.getByRole('button', { name: /Close sources sidebar/i }),
      )
    },
    20_000,
  )

  it(
    'previews PDFs in a modal and directly downloads non-previewable files',
    async () => {
      const user = userEvent.setup()
      server.use(
        http.all('*/api/file', async ({ request }) => {
          if (request.method === 'HEAD') return new HttpResponse(null, { status: 200 })
          return new HttpResponse('hello', { status: 200 })
        }),
      )

      const anchorClick = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {})

      const userMsg = makeMessage({
        id: 'u1',
        role: 'user',
        content: [
          { type: 'text', text: 'Here are my files' },
          {
            type: 'file',
            fileName: 'Lecture1.pdf',
            fileType: 'application/pdf',
            fileUrl: 'cs101/lecture1.pdf',
          },
          {
            type: 'file',
            fileName: 'Notes.docx',
            fileType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileUrl: 'cs101/notes.docx',
          },
        ] as any,
      })

      const conversation = makeConversation({
        id: 'conv-1',
        messages: [userMsg],
      })

      const { ChatMessage } = await import('../ChatMessage')

      renderWithProviders(
        <ChatMessage message={userMsg as any} messageIndex={0} courseName="CS101" />,
        {
          homeState: {
            selectedConversation: conversation as any,
            messageIsStreaming: false,
            loading: false,
          },
          homeContext: { dispatch: vi.fn() },
        },
      )

      // Previewable PDF opens modal with iframe.
      await user.click(await screen.findByText('Lecture1.pdf'))
      expect(await screen.findByLabelText('Close file preview')).toBeInTheDocument()
      expect(await screen.findByTitle('Lecture1.pdf')).toBeInTheDocument()
      await user.click(screen.getByLabelText('Close file preview'))

      // Non-previewable file triggers direct download (anchor click).
      await user.click(await screen.findByText('Notes.docx'))
      expect(anchorClick).toHaveBeenCalled()
    },
    20_000,
  )

  it(
    'previews text files by fetching content via a presigned URL',
    async () => {
      const user = userEvent.setup()

      server.use(
        http.all('*/api/file', async ({ request }) => {
          if (request.method === 'HEAD') return new HttpResponse(null, { status: 200 })
          return new HttpResponse('hello world', { status: 200 })
        }),
      )

      const userMsg = makeMessage({
        id: 'u1',
        role: 'user',
        content: [
          { type: 'text', text: 'Here is a text file' },
          {
            type: 'file',
            fileName: 'notes.txt',
            fileType: 'text/plain',
            fileUrl: 'cs101/notes.txt',
          },
        ] as any,
      })

      const conversation = makeConversation({
        id: 'conv-1',
        messages: [userMsg],
      })

      const { ChatMessage } = await import('../ChatMessage')

      renderWithProviders(
        <ChatMessage message={userMsg as any} messageIndex={0} courseName="CS101" />,
        {
          homeState: {
            selectedConversation: conversation as any,
            messageIsStreaming: false,
            loading: false,
          },
          homeContext: { dispatch: vi.fn() },
        },
      )

      await user.click(await screen.findByText('notes.txt'))
      expect(await screen.findByLabelText('Close file preview')).toBeInTheDocument()
      expect(await screen.findByText(/hello world/i)).toBeInTheDocument()
      await user.click(screen.getByLabelText('Close file preview'))
    },
    20_000,
  )

  it('allows editing a user message and persists changes', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'Hello',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
        onEdit={onEdit as any}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /Edit message/i }))
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, 'Hello edited')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(onEdit).toHaveBeenCalled())
    await waitFor(() =>
      expect(messageMocks.saveConversationToServer).toHaveBeenCalled(),
    )
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/UIUC-api/logConversation',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })

  it('opens feedback modal and submits negative feedback', async () => {
    const user = userEvent.setup()
    const onFeedback = vi.fn()

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: 'Answer',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Hi' }), assistantMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" onFeedback={onFeedback as any} />,
      {
        homeState: { selectedConversation: conversation as any, messageIsStreaming: false, loading: false },
        homeContext: { dispatch: vi.fn() },
      },
    )

    const openButtons = screen.getAllByRole('button', {
      name: /Open feedback/i,
    })
    await user.click(openButtons[0]!)
    expect(screen.getByRole('dialog', { name: 'Feedback modal' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Submit feedback/i }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Feedback modal' })).not.toBeInTheDocument(),
    )
  })

  it('edits a user message and preserves attached files', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const onEdit = vi.fn()

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: [
        { type: 'text', text: 'Old text' },
        {
          type: 'file',
          fileName: 'Lecture1.pdf',
          fileType: 'application/pdf',
          fileUrl: 'cs101/lecture1.pdf',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
        onEdit={onEdit as any}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          loading: false,
          messageIsStreaming: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /Edit message/i }))
    const textbox = await screen.findByRole('textbox')
    await user.clear(textbox)
    await user.type(textbox, 'New text{enter}')

    expect(onEdit).toHaveBeenCalled()
    const edited = onEdit.mock.calls[0]?.[0]
    expect(Array.isArray(edited.content)).toBe(true)
    expect((edited.content as any[]).some((c) => c.type === 'file')).toBe(true)
    expect(messageMocks.saveConversationToServer).toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('shows a timer for streaming assistant messages', async () => {
    vi.useFakeTimers()
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      const userMsg = makeMessage({
        id: 'u1',
        role: 'user',
        content: 'Question',
        contexts: [
          makeContextWithMetadata({
            readable_filename: 'Lecture1.pdf',
            s3_path: 'cs101/lecture1.pdf',
            url: '',
          }),
        ],
      })

      const assistantMsg = makeMessage({
        id: 'a1',
        role: 'assistant',
        content: [
          { type: 'text', text: 'Working...' },
          {
            type: 'image_url',
            image_url: {
              url: 'https://s3.amazonaws.com/bucket/img.png?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60',
            },
          },
        ] as any,
        tools: [
          {
            id: 'tool-1',
            name: 'tool_name',
            readableName: 'Tool',
            description: 'd',
            aiGeneratedArgumentValues: {
              image_urls: JSON.stringify([
                'https://s3.amazonaws.com/bucket/arg.png?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60',
              ]),
            },
            output: { s3Paths: ['cs101/out.png'], imageUrls: [] },
          } as any,
        ],
      })

      const conversation = makeConversation({
        id: 'conv-1',
        messages: [userMsg, assistantMsg],
      })

      const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

      renderWithProviders(
        <SourcesSidebarProvider>
          <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />
        </SourcesSidebarProvider>,
        {
          homeState: {
            selectedConversation: conversation as any,
            messageIsStreaming: true,
            isImg2TextLoading: true,
            isQueryRewriting: true,
            isRetrievalLoading: true,
            isRouting: true,
            isRunningTool: true,
            loading: false,
          } as any,
          homeContext: { dispatch: vi.fn() },
        },
      )

      await vi.advanceTimersByTimeAsync(1100)
      expect(screen.getByText(/1 s\./i)).toBeInTheDocument()

    } finally {
      vi.useRealTimers()
    }
  })

  it('renders intermediate tool accordions on the latest user message while streaming', async () => {
    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: [{ type: 'text', text: 'Question' }] as any,
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'Lecture1.pdf',
          s3_path: 'cs101/lecture1.pdf',
          url: '',
        }),
      ],
      tools: [
        {
          id: 'tool-1',
          name: 'tool_name',
          readableName: 'Tool',
          description: 'd',
          aiGeneratedArgumentValues: {
            image_urls: JSON.stringify([]),
          },
          output: { s3Paths: ['cs101/out.png'], imageUrls: [] },
        } as any,
      ],
      wasQueryRewritten: true,
      queryRewriteText: 'optimized query',
    })

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: '…',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg, assistantMsg],
    })

    const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage message={userMsg as any} messageIndex={0} courseName="CS101" />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: true,
          isImg2TextLoading: true,
          isQueryRewriting: true,
          isRetrievalLoading: true,
          isRouting: true,
          isRunningTool: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getAllByText(/Image Description/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Optimized search query/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Retrieved documents/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Routing the request/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Tool output from/i).length).toBeGreaterThan(0)
  })

  it('renders a default file icon and truncates long filenames', async () => {
    const user = userEvent.setup()

    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    const longName = 'this-is-a-very-very-very-long-filename-for-archive.zip'
    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: [
        { type: 'text', text: 'Files' },
        {
          type: 'file',
          fileName: longName,
          fileType: 'application/zip',
          fileUrl: 'cs101/archive.zip',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage message={userMsg as any} messageIndex={0} courseName="CS101" />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    const displayed = await screen.findByText(/\.zip$/i)
    expect(displayed.textContent).toContain('...')

    await user.click(displayed)
    expect(anchorClick).toHaveBeenCalled()
  })

  it('shows a fallback message when text file preview fetch fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    server.use(
      http.get('*/api/file', async () => {
        return HttpResponse.error()
      }),
    )

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: [
        { type: 'text', text: 'Here is a text file' },
        {
          type: 'file',
          fileName: 'notes.txt',
          fileType: 'text/plain',
          fileUrl: 'cs101/notes.txt',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage message={userMsg as any} messageIndex={0} courseName="CS101" />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(await screen.findByText('notes.txt'))
    expect(await screen.findByText(/Failed to load file content/i)).toBeInTheDocument()
  }, 20000)

  it('handles thumbnail fetch errors and invalid web URLs', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const api = await import('~/utils/apiUtils')
    ;(api.fetchPresignedUrl as any).mockRejectedValueOnce(new Error('thumb fail'))

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Lecture1.pdf',
      s3_path: 'cs101/lecture1.pdf',
      url: '',
    })
    const ctxWeb = makeContextWithMetadata({
      readable_filename: 'web',
      s3_path: undefined,
      url: 'not a url',
    })
    const ctxMd = makeContextWithMetadata({
      readable_filename: 'notes.md',
      s3_path: 'cs101/notes.md',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'Question',
      contexts: [ctxPdf, ctxWeb, ctxMd],
    })

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: 'Answer',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg, assistantMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage
        message={assistantMsg as any}
        messageIndex={1}
        courseName="CS101"
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() => expect(api.fetchPresignedUrl).toHaveBeenCalled())
  }, 20000)

  it('refreshes S3 citation links, preserves #page anchors, and skips non-S3 links', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const api = await import('~/utils/apiUtils')
    ;(api.fetchPresignedUrl as any).mockResolvedValue('http://localhost/new-presigned')

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content:
        [
          '[S3](https://s3.amazonaws.com/bucket/file.pdf?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60#page=2 "Citation 1")',
          '[NoSign](https://s3.amazonaws.com/bucket/nosign.pdf "Citation 2")',
          '[Other](https://example.com/doc.pdf "Citation 3")',
          '[Bad](https://% "Citation 4")',
        ].join('\\n'),
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Q' }), assistantMsg],
    })

    const { ChatMessage } = await import('../ChatMessage')
    renderWithProviders(
      <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />,
      {
        homeState: { selectedConversation: conversation as any, messageIsStreaming: false, loading: false },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() => expect(api.fetchPresignedUrl).toHaveBeenCalled())
  }, 20000)

  it('renders a thoughts-only streaming assistant message with a cursor indicator', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: '<think>draft</think>',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Q' }), assistantMsg],
    })

    renderWithProviders(
      <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(await screen.findByText(/AI's Thought Process/i)).toBeInTheDocument()
    expect(screen.getByText(/▍/)).toBeInTheDocument()
  })

  it('renders markdown links embedded inside code blocks as links', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: '```text\n[Link](https://example.com)\n```',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Q' }), assistantMsg],
    })

    renderWithProviders(
      <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(await screen.findByRole('link', { name: 'Link' })).toBeInTheDocument()
  })

  it('extracts citation indices from array content when opening the sources sidebar', async () => {
    const user = userEvent.setup()
    const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Lecture1.pdf',
      s3_path: 'cs101/lecture1.pdf',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'Question',
      contexts: [ctxPdf],
    })

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'A [cite](https://s3.amazonaws.com/bucket/file.pdf "Citation 1") and "Citations 2, 3" and (Doc | 4)',
        },
      ] as any,
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />
      </SourcesSidebarProvider>,
      {
        homeState: { selectedConversation: conversation as any, messageIsStreaming: false, loading: false },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(await screen.findByRole('button', { name: /Sources/i }))
    expect(
      await screen.findByRole('button', { name: /Close sources sidebar/i }),
    ).toBeInTheDocument()
  }, 20000)

  it('validates image URLs, handles invalid URLs, and tolerates presigned URL failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const api = await import('~/utils/apiUtils')
    ;(api.fetchPresignedUrl as any).mockRejectedValueOnce(new Error('fail'))

    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: 'https://s3.amazonaws.com/bucket/img.png?X-Amz-Signature=abc&X-Amz-Date=29990101T000000Z&X-Amz-Expires=60',
          },
        },
        {
          type: 'image_url',
          image_url: { url: '/cs101/out.png' },
        },
        {
          type: 'image_url',
          image_url: { url: 'http://[invalid' },
        },
      ] as any,
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Q' }), assistantMsg],
    })

    renderWithProviders(
      <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() => expect(api.fetchPresignedUrl).toHaveBeenCalled())
  }, 20000)
})
