import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import {
  makeContextWithMetadata,
  makeConversation,
  makeMessage,
} from '~/test-utils/mocks/chat'
import { type AgentEvent } from '@/types/chat'

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
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchPresignedUrl: vi.fn(async () => 'http://localhost/api/file'),
  }
})

vi.mock('@/hooks/__internal__/conversation', async (importOriginal) => {
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

const makeAgentRetrievalEvent = () =>
  ({
    id: 'agent-step-1-retrieval-0',
    stepNumber: 1,
    type: 'retrieval',
    status: 'done',
    title: 'Searching documents',
    createdAt: '2026-03-09T20:00:00.000Z',
    updatedAt: '2026-03-09T20:00:03.000Z',
    metadata: {
      contextQuery: 'transformers',
      contextsRetrieved: 6,
    },
  }) as const

async function renderAgentTimelineMessage({
  agentEvents,
  messageId,
}: {
  agentEvents: AgentEvent[]
  messageId: string
}) {
  const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

  const userMsg = makeMessage({
    id: messageId,
    role: 'user',
    content: 'Find papers about transformers',
    agentEvents,
  })

  const conversation = makeConversation({
    id: `${messageId}-conversation`,
    messages: [userMsg],
  })

  renderWithProviders(
    <SourcesSidebarProvider>
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
      />
    </SourcesSidebarProvider>,
    {
      homeState: {
        selectedConversation: conversation as any,
        messageIsStreaming: true,
        loading: false,
      },
      homeContext: { dispatch: vi.fn() },
    },
  )
}

describe('ChatMessage', () => {
  it('keeps agent timeline active for the current in-progress user message', async () => {
    await renderAgentTimelineMessage({
      messageId: 'u-agent',
      agentEvents: [makeAgentRetrievalEvent()],
    })

    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(screen.getByText('6 chunks so far')).toBeInTheDocument()
  })

  it('marks agent timeline complete once final response generation begins', async () => {
    await renderAgentTimelineMessage({
      messageId: 'u-agent-final',
      agentEvents: [
        makeAgentRetrievalEvent(),
        {
          id: 'agent-final-response',
          stepNumber: 2,
          type: 'final_response',
          status: 'running',
          title: 'Generating response',
          createdAt: '2026-03-09T20:00:04.000Z',
        },
      ],
    })

    expect(await screen.findByText('6 chunks retrieved')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('renders assistant markdown and opens Sources sidebar when contexts exist', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

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
        '<think>draft</think>Here is an answer.\\n\\n[Lecture](https://s3.amazonaws.com/bucket/lecture1.pdf?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60 "Citation 1")',
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
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
        />
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
  }, 20_000)

  it('previews PDFs in a modal and directly downloads non-previewable files', async () => {
    const user = userEvent.setup()
    server.use(
      http.all('*/api/file', async ({ request }) => {
        if (request.method === 'HEAD')
          return new HttpResponse(null, { status: 200 })
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
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    // Previewable PDF opens modal with iframe.
    await user.click(await screen.findByText('Lecture1.pdf'))
    expect(
      await screen.findByLabelText('Close file preview'),
    ).toBeInTheDocument()
    expect(await screen.findByTitle('Lecture1.pdf')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Close file preview'))

    // Non-previewable file triggers direct download (anchor click).
    await user.click(await screen.findByText('Notes.docx'))
    expect(anchorClick).toHaveBeenCalled()
  }, 20_000)

  it('previews text files by fetching content via a presigned URL', async () => {
    const user = userEvent.setup()

    server.use(
      http.all('*/api/file', async ({ request }) => {
        if (request.method === 'HEAD')
          return new HttpResponse(null, { status: 200 })
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
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    await user.click(await screen.findByText('notes.txt'))
    expect(
      await screen.findByLabelText('Close file preview'),
    ).toBeInTheDocument()
    expect(await screen.findByText(/hello world/i)).toBeInTheDocument()
    await user.click(screen.getByLabelText('Close file preview'))
  }, 20_000)

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
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Hi' }),
        assistantMsg,
      ],
    })

    const { ChatMessage } = await import('../ChatMessage')

    renderWithProviders(
      <ChatMessage
        message={assistantMsg as any}
        messageIndex={1}
        courseName="CS101"
        onFeedback={onFeedback as any}
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

    const openButtons = screen.getAllByRole('button', {
      name: /Open feedback/i,
    })
    await user.click(openButtons[0]!)
    expect(
      screen.getByRole('dialog', { name: 'Feedback modal' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Submit feedback/i }))
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Feedback modal' }),
      ).not.toBeInTheDocument(),
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

      const { ChatMessage, SourcesSidebarProvider } = await import(
        '../ChatMessage'
      )

      renderWithProviders(
        <SourcesSidebarProvider>
          <ChatMessage
            message={assistantMsg as any}
            messageIndex={1}
            courseName="CS101"
          />
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

    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
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
    expect(
      screen.getAllByText(/Optimized search query/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Retrieved documents/i).length).toBeGreaterThan(
      0,
    )
    expect(screen.getAllByText(/Routing the request/i).length).toBeGreaterThan(
      0,
    )
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
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    await user.click(await screen.findByText('notes.txt'))
    expect(
      await screen.findByText(/Failed to load file content/i),
    ).toBeInTheDocument()
  }, 20000)

  it('handles thumbnail fetch errors and invalid web URLs', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const api = await import('~/utils/apiUtils')
    ;(api.fetchPresignedUrl as any).mockRejectedValueOnce(
      new Error('thumb fail'),
    )

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
    ;(api.fetchPresignedUrl as any).mockResolvedValue(
      'http://localhost/new-presigned',
    )

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: [
        '[S3](https://s3.amazonaws.com/bucket/file.pdf?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60#page=2 "Citation 1")',
        '[NoSign](https://s3.amazonaws.com/bucket/nosign.pdf "Citation 2")',
        '[Other](https://example.com/doc.pdf "Citation 3")',
        '[Bad](https://% "Citation 4")',
      ].join('\\n'),
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
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
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

    renderWithProviders(
      <ChatMessage
        message={assistantMsg as any}
        messageIndex={1}
        courseName="CS101"
      />,
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
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

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
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByRole('link', { name: 'Link' }),
    ).toBeInTheDocument()
  })

  it('extracts citation indices from array content when opening the sources sidebar', async () => {
    const user = userEvent.setup()
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

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
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
        />
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
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

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
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() => expect(api.fetchPresignedUrl).toHaveBeenCalled())
  }, 20000)

  // ---------- NEW COVERAGE TESTS ----------

  it('renders a user message with simple string content (non-array)', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-simple',
      role: 'user',
      content: 'Just a plain text message',
    })

    const conversation = makeConversation({
      id: 'conv-simple',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    expect(
      await screen.findByText('Just a plain text message'),
    ).toBeInTheDocument()
  })

  it('cancels editing without saving via the Cancel button', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-cancel',
      role: 'user',
      content: 'Original message',
    })

    const conversation = makeConversation({
      id: 'conv-cancel',
      messages: [userMsg],
    })

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

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /Edit message/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    // Click Cancel
    await user.click(screen.getByRole('button', { name: /Cancel/i }))

    // Should exit editing mode without calling onEdit
    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not submit edit when message content is empty', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-empty',
      role: 'user',
      content: 'Hello',
    })

    const conversation = makeConversation({
      id: 'conv-empty',
      messages: [userMsg],
    })

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

    // The Save & Submit button should be disabled when empty
    const saveBtn = screen.getByRole('button', { name: /Save & Submit/i })
    expect(saveBtn).toBeDisabled()

    // Pressing Enter with empty content should not submit
    await user.keyboard('{Enter}')
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('does not submit edit on Shift+Enter (allows newline)', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-shift',
      role: 'user',
      content: 'Hello',
    })

    const conversation = makeConversation({
      id: 'conv-shift',
      messages: [userMsg],
    })

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
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    // Shift+Enter should NOT submit
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('renders "Generating final response" spinner when loading and tools are done', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-loading',
      role: 'user',
      content: 'Question',
      tools: [
        {
          id: 'tool-done',
          name: 'done_tool',
          readableName: 'DoneTool',
          description: 'd',
          output: { text: 'result' },
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-loading',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: true,
          isRouting: false,
          isRetrievalLoading: false,
          isImg2TextLoading: false,
          isQueryRewriting: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByText('Generating final response…'),
    ).toBeInTheDocument()
  })

  it('does NOT show "Generating final response" when agent mode is enabled', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-agent-loading',
      role: 'user',
      content: 'Question',
    })

    const conversation = makeConversation({
      id: 'conv-agent-loading',
      messages: [userMsg],
      agentModeEnabled: true,
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: true,
          isRouting: false,
          isRetrievalLoading: false,
          isImg2TextLoading: false,
          isQueryRewriting: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Wait for render then assert absence
    await waitFor(() =>
      expect(screen.getByText('Question')).toBeInTheDocument(),
    )
    expect(
      screen.queryByText('Generating final response…'),
    ).not.toBeInTheDocument()
  })

  it('shows wasQueryRewritten=false accordion text', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-noqr',
      role: 'user',
      content: 'Question',
      wasQueryRewritten: false,
      queryRewriteText: '',
    })

    const conversation = makeConversation({
      id: 'conv-noqr',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isQueryRewriting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByText('No query optimization necessary'),
    ).toBeInTheDocument()
  })

  it('shows tool routing accordions with argument display when isRouting=false and tools present', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-toolroute',
      role: 'user',
      content: 'Question',
      tools: [
        {
          id: 'tool-routed',
          name: 'my_tool',
          readableName: 'MyTool',
          description: 'd',
          aiGeneratedArgumentValues: {
            query: 'test query',
          },
          output: { text: 'Tool output result text' },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-toolroute',
      role: 'assistant',
      content: 'Tool result',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-toolroute',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Tool routing accordion with badge
    await waitFor(() => {
      expect(
        screen.getAllByText('MyTool', { exact: false }).length,
      ).toBeGreaterThanOrEqual(1)
    })
    // Tool output accordion
    expect(
      screen.getAllByText(/Tool output from/i).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('shows tool error state in output accordion', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-toolerr',
      role: 'user',
      content: 'Question',
      tools: [
        {
          id: 'tool-err',
          name: 'err_tool',
          readableName: 'ErrTool',
          description: 'd',
          error: 'Something went wrong with the tool',
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-toolerr',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByText('Something went wrong with the tool'),
    ).toBeInTheDocument()
  })

  it('shows tool output with data (JSON) when no text field', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tooldata',
      role: 'user',
      content: 'Question',
      tools: [
        {
          id: 'tool-data',
          name: 'data_tool',
          readableName: 'DataTool',
          description: 'd',
          output: { data: { key: 'value' } },
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-tooldata',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // JSON.stringify output should appear
    await waitFor(() =>
      expect(screen.getByText(/"key": "value"/)).toBeInTheDocument(),
    )
  })

  it('hides edit button when user message contains image_url content', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-img',
      role: 'user',
      content: [
        { type: 'text', text: 'Look at this' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.png' },
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-img',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
        onEdit={vi.fn() as any}
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

    await screen.findByText('Look at this')

    // The edit button should have the 'hidden' class when image_url content exists
    const editBtn = screen.getByRole('button', { name: /Edit message/i })
    expect(editBtn.className).toContain('hidden')
  })

  it('does not show MessageActions while streaming the last assistant message', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a-streaming',
      role: 'assistant',
      content: 'Partial response...',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-streaming',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

    renderWithProviders(
      <ChatMessage
        message={assistantMsg as any}
        messageIndex={1}
        courseName="CS101"
        onFeedback={vi.fn() as any}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: true,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() =>
      expect(screen.queryByText('Partial response...')).toBeInTheDocument(),
    )

    // MessageActions mock renders "Open feedback" button - should not appear while streaming
    expect(
      screen.queryByRole('button', { name: /Open feedback/i }),
    ).not.toBeInTheDocument()
  })

  it('does not show MessageActions while loading the last assistant message', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a-loading',
      role: 'assistant',
      content: 'Response text',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-load',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

    renderWithProviders(
      <ChatMessage
        message={assistantMsg as any}
        messageIndex={1}
        courseName="CS101"
        onFeedback={vi.fn() as any}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: true,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() =>
      expect(screen.getByText('Response text')).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: /Open feedback/i }),
    ).not.toBeInTheDocument()
  })

  it('shows MessageActions for a non-last assistant message even when streaming', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a-old',
      role: 'assistant',
      content: 'Old answer',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-old',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q1' }),
        assistantMsg,
        makeMessage({ id: 'u2', role: 'user', content: 'Q2' }),
        makeMessage({
          id: 'a2',
          role: 'assistant',
          content: 'New answer...',
        }),
      ],
    })

    renderWithProviders(
      <ChatMessage
        message={assistantMsg as any}
        messageIndex={1}
        courseName="CS101"
        onFeedback={vi.fn() as any}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: true,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    // This is not the last message, so MessageActions should appear even if streaming
    expect(
      await screen.findByRole('button', { name: /Open feedback/i }),
    ).toBeInTheDocument()
  })

  it('does not show Sources button while streaming the last assistant message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Doc.pdf',
      s3_path: 'cs101/doc.pdf',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'Q',
      contexts: [ctxPdf],
    })

    const assistantMsg = makeMessage({
      id: 'a-stream-src',
      role: 'assistant',
      content: 'Working...',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-stream-src',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: true,
          loading: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() =>
      expect(screen.getByText('Working...')).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: /Sources/i }),
    ).not.toBeInTheDocument()
  })

  it('renders assistant message with own contexts (not from previous user message)', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctx = makeContextWithMetadata({
      readable_filename: 'OwnCtx.pdf',
      s3_path: 'cs101/own.pdf',
      url: '',
    })

    const assistantMsg = makeMessage({
      id: 'a-own-ctx',
      role: 'assistant',
      content: 'Answer with own contexts',
      contexts: [ctx],
    })

    const conversation = makeConversation({
      id: 'conv-own-ctx',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
        />
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

    // Sources button should appear because assistant itself has contexts
    expect(
      await screen.findByRole('button', { name: /Sources/i }),
    ).toBeInTheDocument()
  })

  it('renders user message with image description text in accordion', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-imgdesc',
      role: 'user',
      content: [
        { type: 'text', text: 'Check this' },
        {
          type: 'text',
          text: 'Image description: A cat sitting on a mat',
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/cat.png' },
        },
      ] as any,
    })

    const assistantMsg = makeMessage({
      id: 'a-imgdesc',
      role: 'assistant',
      content: 'Description response',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-imgdesc',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
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

    // The image description accordion should render
    await waitFor(() => {
      expect(
        screen.getAllByText(/Image Description/i).length,
      ).toBeGreaterThanOrEqual(1)
    })

    // The text "Check this" should render but NOT the "Image description:" text as regular text
    expect(screen.getByText('Check this')).toBeInTheDocument()
  })

  it('renders file cards for xls and ppt file types', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-office',
      role: 'user',
      content: [
        { type: 'text', text: 'Office files' },
        {
          type: 'file',
          fileName: 'data.xlsx',
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileUrl: 'cs101/data.xlsx',
        },
        {
          type: 'file',
          fileName: 'slides.pptx',
          fileType:
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          fileUrl: 'cs101/slides.pptx',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-office',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    // Both files should render (truncated or not)
    expect(await screen.findByText(/data\.xlsx/)).toBeInTheDocument()
    expect(screen.getByText(/slides\.pptx/)).toBeInTheDocument()
  })

  it('renders retrieval loading accordion for user message at second-to-last position', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-ret',
      role: 'user',
      content: 'Question about docs',
    })

    const assistantMsg = makeMessage({
      id: 'a-ret',
      role: 'assistant',
      content: '',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-ret',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRetrievalLoading: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(await screen.findByText(/Retrieving documents/i)).toBeInTheDocument()
  })

  it('renders routing accordion for user message at second-to-last position', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-route2',
      role: 'user',
      content: 'Route this',
    })

    const assistantMsg = makeMessage({
      id: 'a-route2',
      role: 'assistant',
      content: '',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-route2',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByText(/Routing the request to relevant tools/i),
    ).toBeInTheDocument()
  })

  it('renders query rewriting accordion for last user message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-qr',
      role: 'user',
      content: 'Search this',
    })

    const conversation = makeConversation({
      id: 'conv-qr',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isQueryRewriting: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByText(/Optimizing search query/i),
    ).toBeInTheDocument()
  })

  it('renders tool output with imageUrls in output accordion', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-toolimg',
      role: 'user',
      content: 'Generate image',
      tools: [
        {
          id: 'tool-imgout',
          name: 'img_tool',
          readableName: 'ImgTool',
          description: 'd',
          output: {
            imageUrls: ['https://example.com/output.png'],
            text: 'Here is the generated image',
          },
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-toolimg',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await waitFor(() =>
      expect(
        screen.getAllByText(/Tool output from/i).length,
      ).toBeGreaterThanOrEqual(1),
    )
  })

  it('renders tool still loading (no output, no error)', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-toolpending',
      role: 'user',
      content: 'Waiting for tool',
      tools: [
        {
          id: 'tool-pending',
          name: 'pending_tool',
          readableName: 'PendingTool',
          description: 'd',
          // No output and no error => isLoading should be true
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-toolpending',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(await screen.findByText(/Tool output from/i)).toBeInTheDocument()
  })

  it('renders tool argument values with image_urls containing items', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-toolargimg',
      role: 'user',
      content: 'With tool images',
      tools: [
        {
          id: 'tool-argimg',
          name: 'img_arg_tool',
          readableName: 'ImgArgTool',
          description: 'd',
          aiGeneratedArgumentValues: {
            image_urls: JSON.stringify([
              'https://example.com/arg1.png',
              'https://example.com/arg2.png',
            ]),
          },
          output: { text: 'done' },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-toolargimg',
      role: 'assistant',
      content: 'Tool images result',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-toolargimg',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // The tool routing accordion with image_urls should render
    await waitFor(() => {
      expect(
        screen.getAllByText('ImgArgTool', { exact: false }).length,
      ).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders tool argument values with empty image_urls array showing "No arguments provided"', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-toolnoarg',
      role: 'user',
      content: 'Empty tool args',
      tools: [
        {
          id: 'tool-noarg',
          name: 'empty_arg_tool',
          readableName: 'EmptyArgTool',
          description: 'd',
          aiGeneratedArgumentValues: {
            image_urls: JSON.stringify([]),
          },
          output: { text: 'done' },
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-toolnoarg',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(await screen.findByText('No arguments provided')).toBeInTheDocument()
  })

  it('renders web context thumbnails as favicons', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctxWeb = makeContextWithMetadata({
      readable_filename: 'Web page',
      s3_path: undefined,
      url: 'https://example.com/page',
    })

    const userMsg = makeMessage({
      id: 'u-web',
      role: 'user',
      content: 'Q',
      contexts: [ctxWeb],
    })

    const assistantMsg = makeMessage({
      id: 'a-web',
      role: 'assistant',
      content: 'Answer about web',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-web',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
        />
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

    // Sources button should appear
    expect(
      await screen.findByRole('button', { name: /Sources/i }),
    ).toBeInTheDocument()
  })

  it('renders assistant message with array content (Content[])', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a-array',
      role: 'assistant',
      content: [
        { type: 'text', text: 'First paragraph' },
        { type: 'text', text: 'Second paragraph' },
      ] as any,
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-array',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

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

    // The content should be joined and rendered
    expect(await screen.findByText(/First paragraph/)).toBeInTheDocument()
  })

  it('renders assistant message with array content containing think tags', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a-array-think',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '<think>internal reasoning</think>The answer is 42',
        },
      ] as any,
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-array-think',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

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

    expect(await screen.findByText(/AI's Thought Process/i)).toBeInTheDocument()
    expect(screen.getByText(/The answer is 42/)).toBeInTheDocument()
  })

  it('handles img2Text loading accordion for second-to-last user message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-img2t',
      role: 'user',
      content: [
        { type: 'text', text: 'What is this?' },
        { type: 'text', text: 'Image description: A cat' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/cat.png' },
        },
      ] as any,
    })

    const assistantMsg = makeMessage({
      id: 'a-img2t',
      role: 'assistant',
      content: '',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-img2t',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isImg2TextLoading: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Should show image description accordion(s) - both loading and static
    const descriptions = await screen.findAllByText(/Image Description/i)
    expect(descriptions.length).toBeGreaterThanOrEqual(1)
  })

  it('renders assistant message with no content gracefully', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const assistantMsg = makeMessage({
      id: 'a-empty',
      role: 'assistant',
      content: '',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-empty-a',
      messages: [
        makeMessage({ id: 'u1', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

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

    // Should render the robot icon at minimum
    await waitFor(() =>
      expect(document.querySelector('.tabler-icon-robot')).toBeInTheDocument(),
    )
  })

  it('renders file card for doc (not docx) file extension', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-doc',
      role: 'user',
      content: [
        { type: 'text', text: 'A doc file' },
        {
          type: 'file',
          fileName: 'legacy.doc',
          fileType: 'application/msword',
          fileUrl: 'cs101/legacy.doc',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-doc',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    expect(await screen.findByText('legacy.doc')).toBeInTheDocument()
  })

  it('handles a file card without a fileName gracefully (fallback to "Unknown file")', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-noname',
      role: 'user',
      content: [
        { type: 'text', text: 'File here' },
        {
          type: 'file',
          // No fileName
          fileType: 'application/octet-stream',
          fileUrl: 'cs101/mystery',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-noname',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
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

    expect(await screen.findByText('Unknown file')).toBeInTheDocument()
  })

  it('renders "Generating final response" for second-to-last user message when loading', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-gen2',
      role: 'user',
      content: 'Question 2',
    })

    const assistantMsg = makeMessage({
      id: 'a-gen2',
      role: 'assistant',
      content: '',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-gen2',
      messages: [userMsg, assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: true,
          isRouting: false,
          isRetrievalLoading: false,
          isImg2TextLoading: false,
          isQueryRewriting: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      await screen.findByText('Generating final response…'),
    ).toBeInTheDocument()
  })

  it('renders tool routing accordion with non-image argument values as JSON pre block', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tooljson',
      role: 'user',
      content: 'Run tool',
      tools: [
        {
          id: 'tool-json',
          name: 'json_tool',
          readableName: 'JsonTool',
          description: 'd',
          aiGeneratedArgumentValues: {
            query: 'test',
            limit: '10',
          },
          output: { text: 'result' },
        } as any,
      ],
    })

    const conversation = makeConversation({
      id: 'conv-tooljson',
      messages: [userMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={userMsg as any}
          messageIndex={0}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Should render JSON stringified argument values in a pre block
    await waitFor(() =>
      expect(screen.getByText(/"query": "test"/)).toBeInTheDocument(),
    )
  })
})
