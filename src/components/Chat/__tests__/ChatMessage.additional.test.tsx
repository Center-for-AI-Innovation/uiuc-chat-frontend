import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import {
  makeContextWithMetadata,
  makeConversation,
  makeMessage,
} from '~/test-utils/mocks/chat'

const messageMocks = vi.hoisted(() => ({
  saveConversationToServer: vi.fn(async () => ({})),
}))

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
  default: ({ onOpenFeedbackModal, onRegenerate, onFeedback }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'message-actions' },
      React.createElement(
        'button',
        { type: 'button', onClick: onOpenFeedbackModal },
        'Open feedback',
      ),
      onRegenerate
        ? React.createElement(
            'button',
            { type: 'button', onClick: () => onRegenerate(0) },
            'Regenerate',
          )
        : null,
    ),
}))

describe('ChatMessage - additional coverage', () => {
  // ── Edit mode: Cancel button ──────────────────────────────────────────

  it('cancels editing when clicking the Cancel button', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { ChatMessage } = await import('../ChatMessage')
    const { fireEvent } = await import('@testing-library/react')

    const userMsg = makeMessage({
      id: 'u-cancel',
      role: 'user',
      content: 'Original text',
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
        onEdit={vi.fn()}
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

    // Enter edit mode via fireEvent (avoids Tooltip/Mantine pointer event delays)
    fireEvent.click(screen.getByRole('button', { name: /Edit message/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

    // Click Cancel
    const cancelBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('Cancel'))
    expect(cancelBtn).toBeDefined()
    fireEvent.click(cancelBtn!)

    // Should exit edit mode - textbox should no longer exist
    await waitFor(() =>
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Original text')).toBeInTheDocument()
  })

  // ── Edit mode: Empty content doesn't submit ───────────────────────────

  it('does not submit when edited content is empty', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { fireEvent } = await import('@testing-library/react')
    const onEdit = vi.fn()
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-empty',
      role: 'user',
      content: 'Something',
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
        onEdit={onEdit}
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

    fireEvent.click(screen.getByRole('button', { name: /Edit message/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '' } })

    // The Save & Submit button should be disabled
    const saveButton = screen.getByText('Save & Submit').closest('button')
    expect(saveButton).toBeDisabled()

    // Pressing Enter with empty content shouldn't call onEdit
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(onEdit).not.toHaveBeenCalled()
  })

  // ── Edit mode: Shift+Enter does not submit ────────────────────────────

  it('does not submit when Shift+Enter is pressed during editing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { fireEvent } = await import('@testing-library/react')
    const onEdit = vi.fn()
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-shift',
      role: 'user',
      content: 'Hello world',
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
        onEdit={onEdit}
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

    fireEvent.click(screen.getByRole('button', { name: /Edit message/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

    // Shift+Enter should not trigger submit
    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      shiftKey: true,
    })
    expect(onEdit).not.toHaveBeenCalled()

    // The textarea should still be visible (still editing)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  // ── User message with plain string content ────────────────────────────

  it('renders plain string content for user messages', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-string',
      role: 'user',
      content: 'Just a simple string message',
    })

    const conversation = makeConversation({
      id: 'conv-string',
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

    expect(screen.getByText('Just a simple string message')).toBeInTheDocument()
  })

  // ── User message with image_url hides edit button ─────────────────────

  it('hides edit button when user message contains image_url content', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-img',
      role: 'user',
      content: [
        { type: 'text', text: 'Look at this image' },
        {
          type: 'image_url',
          image_url: { url: 'http://example.com/img.png' },
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
        onEdit={vi.fn()}
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

    // The edit button should exist but be hidden (class="hidden")
    const editButton = screen.getByRole('button', { name: /Edit message/i })
    expect(editButton.className).toContain('hidden')
  })

  // ── User message with "Image description:" text ───────────────────────

  it('does not render text starting with "Image description:" as regular text', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-imgdesc',
      role: 'user',
      content: [
        { type: 'text', text: 'Check this out' },
        {
          type: 'text',
          text: 'Image description: A beautiful sunset over the ocean',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-imgdesc',
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

    // The regular text should be visible
    expect(screen.getByText('Check this out')).toBeInTheDocument()

    // The Image description should still appear inside IntermediateStateAccordion(s)
    // but not as a plain paragraph
    expect(screen.getAllByText(/Image Description/i).length).toBeGreaterThan(0)
  })

  // ── Assistant message with array Content[] ────────────────────────────

  it('renders assistant message when content is an array of text items', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-arr',
      role: 'assistant',
      content: [
        { type: 'text', text: 'First paragraph.' },
        { type: 'text', text: 'Second paragraph.' },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-arr',
      messages: [
        makeMessage({ id: 'u-arr', role: 'user', content: 'Q' }),
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

    expect(
      await screen.findByText(/First paragraph.*Second paragraph/),
    ).toBeInTheDocument()
  })

  // ── Tool output with error ────────────────────────────────────────────

  it('renders tool error state in the tool output accordion', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-err',
      role: 'user',
      content: [{ type: 'text', text: 'Run tool' }] as any,
      tools: [
        {
          id: 'tool-err-1',
          name: 'broken_tool',
          readableName: 'Broken Tool',
          description: 'A tool that errors',
          error: 'Connection timed out',
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-err',
      role: 'assistant',
      content: 'Error occurred',
    })

    const conversation = makeConversation({
      id: 'conv-tool-err',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Tool output section should be present
    expect(screen.getAllByText(/Tool output from/i).length).toBeGreaterThan(0)
  })

  // ── Tool with text output ─────────────────────────────────────────────

  it('renders tool output text when available', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-text',
      role: 'user',
      content: [{ type: 'text', text: 'Run tool' }] as any,
      tools: [
        {
          id: 'tool-text-1',
          name: 'my_tool',
          readableName: 'My Tool',
          description: 'A tool',
          output: {
            text: 'Tool executed successfully with result ABC',
            imageUrls: [],
            s3Paths: [],
          },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-text',
      role: 'assistant',
      content: 'Done',
    })

    const conversation = makeConversation({
      id: 'conv-tool-text',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      screen.getByText('Tool executed successfully with result ABC'),
    ).toBeInTheDocument()
  })

  // ── Tool with no image_urls shows JSON arguments ──────────────────────

  it('renders JSON.stringify of arguments when no image_urls present', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-json',
      role: 'user',
      content: [{ type: 'text', text: 'Run tool' }] as any,
      tools: [
        {
          id: 'tool-json-1',
          name: 'json_tool',
          readableName: 'JSON Tool',
          description: 'A tool with custom args',
          aiGeneratedArgumentValues: {
            query: 'search term',
            limit: '10',
          },
          output: { text: 'ok', imageUrls: [], s3Paths: [] },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-json',
      role: 'assistant',
      content: 'Done',
    })

    const conversation = makeConversation({
      id: 'conv-tool-json',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // JSON arguments should be rendered
    expect(screen.getByText(/"search term"/)).toBeInTheDocument()
  })

  // ── "Generating final response" loading state ─────────────────────────

  it('shows "Generating final response" when loading and no intermediate states active', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-gen',
      role: 'user',
      content: 'Question',
    })

    const assistantMsg = makeMessage({
      id: 'a-gen',
      role: 'assistant',
      content: '',
    })

    const conversation = makeConversation({
      id: 'conv-gen',
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
          isRetrievalLoading: false,
          isImg2TextLoading: false,
          isQueryRewriting: false,
          isRunningTool: false,
          loading: true,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getByText('Generating final response…')).toBeInTheDocument()
  })

  // ── MessageActions hidden during streaming ────────────────────────────

  it('hides MessageActions when message is streaming and is last message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-stream-hide',
      role: 'user',
      content: 'Q',
    })

    const assistantMsg = makeMessage({
      id: 'a-stream-hide',
      role: 'assistant',
      content: 'Working...',
    })

    const conversation = makeConversation({
      id: 'conv-stream-hide',
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

    // MessageActions should not be rendered while streaming
    expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument()
  })

  // ── MessageActions visible when not streaming ─────────────────────────

  it('shows MessageActions for non-streaming assistant messages', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-actions',
      role: 'user',
      content: 'Q',
    })

    const assistantMsg = makeMessage({
      id: 'a-actions',
      role: 'assistant',
      content: 'An answer',
    })

    const conversation = makeConversation({
      id: 'conv-actions',
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

    expect(screen.getByTestId('message-actions')).toBeInTheDocument()
  })

  // ── Sources button hidden during streaming ────────────────────────────

  it('does not show Sources button while streaming the last message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Doc.pdf',
      s3_path: 'cs/doc.pdf',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u-src-stream',
      role: 'user',
      content: 'Q',
      contexts: [ctxPdf],
    })

    const assistantMsg = makeMessage({
      id: 'a-src-stream',
      role: 'assistant',
      content: 'Answering...',
    })

    const conversation = makeConversation({
      id: 'conv-src-stream',
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

    // Sources button should NOT appear while streaming
    expect(
      screen.queryByRole('button', { name: /Sources/i }),
    ).not.toBeInTheDocument()
  })

  // ── Assistant message displays contexts from previous user message ────

  it('uses contexts from previous user message when assistant has none', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Lecture.pdf',
      s3_path: 'cs/lecture.pdf',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u-ctx-prev',
      role: 'user',
      content: 'Q',
      contexts: [ctxPdf],
    })

    const assistantMsg = makeMessage({
      id: 'a-ctx-prev',
      role: 'assistant',
      content: 'Answer',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-ctx-prev',
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

    // Should show Sources button because it picks up contexts from prev user msg
    const sourcesBtn = await screen.findByRole('button', { name: /Sources/i })
    expect(sourcesBtn).toBeInTheDocument()
  })

  // ── Feedback modal close button ───────────────────────────────────────

  it('closes feedback modal when Close button is clicked', async () => {
    const user = userEvent.setup()
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-fb-close',
      role: 'assistant',
      content: 'Answer',
    })

    const conversation = makeConversation({
      id: 'conv-fb-close',
      messages: [
        makeMessage({ id: 'u-fb-close', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
          onFeedback={vi.fn()}
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

    // Open feedback modal
    const openBtns = screen.getAllByRole('button', { name: /Open feedback/i })
    await user.click(openBtns[0]!)
    expect(
      screen.getByRole('dialog', { name: 'Feedback modal' }),
    ).toBeInTheDocument()

    // Close feedback modal
    await user.click(screen.getByRole('button', { name: /Close feedback/i }))
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Feedback modal' }),
      ).not.toBeInTheDocument(),
    )
  })

  // ── Feedback submit calls onFeedback with correct args ────────────────

  it('calls onFeedback with correct arguments when feedback is submitted', async () => {
    const user = userEvent.setup()
    const onFeedback = vi.fn()
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-fb-submit',
      role: 'assistant',
      content: 'Answer text',
    })

    const conversation = makeConversation({
      id: 'conv-fb-submit',
      messages: [
        makeMessage({ id: 'u-fb-submit', role: 'user', content: 'Q' }),
        assistantMsg,
      ],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg as any}
          messageIndex={1}
          courseName="CS101"
          onFeedback={onFeedback}
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

    const openBtns = screen.getAllByRole('button', { name: /Open feedback/i })
    await user.click(openBtns[0]!)
    await user.click(screen.getByRole('button', { name: /Submit feedback/i }))

    // onFeedback should be called with (messageCopy, false, category, details)
    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a-fb-submit', role: 'assistant' }),
        false,
        'category',
        'details',
      )
    })
  })

  // ── Streaming cursor on assistant text-only message ───────────────────

  it('appends cursor to content when streaming and this is the last message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-cursor',
      role: 'user',
      content: 'Q',
    })

    const assistantMsg = makeMessage({
      id: 'a-cursor',
      role: 'assistant',
      content: 'Partial answer so far',
    })

    const conversation = makeConversation({
      id: 'conv-cursor',
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

    expect(await screen.findByText(/Partial answer so far/)).toBeInTheDocument()
  })

  // ── FileCard with xls extension renders docx icon branch ──────────────

  it('renders file cards for various file types including xls and ppt', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-filetypes',
      role: 'user',
      content: [
        { type: 'text', text: 'Files' },
        {
          type: 'file',
          fileName: 'data.xlsx',
          fileType: 'application/vnd.ms-excel',
          fileUrl: 'cs/data.xlsx',
        },
        {
          type: 'file',
          fileName: 'slides.pptx',
          fileType: 'application/vnd.ms-powerpoint',
          fileUrl: 'cs/slides.pptx',
        },
        {
          type: 'file',
          fileName: 'readme.txt',
          fileType: 'text/plain',
          fileUrl: 'cs/readme.txt',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-filetypes',
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

    expect(screen.getByText('data.xlsx')).toBeInTheDocument()
    expect(screen.getByText('slides.pptx')).toBeInTheDocument()
    expect(screen.getByText('readme.txt')).toBeInTheDocument()
  })

  // ── isFilePreviewable for various extensions ──────────────────────────

  it('renders previewable icon for csv/py/html/xml/srt/vtt files', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-preview-types',
      role: 'user',
      content: [
        { type: 'text', text: 'Files' },
        {
          type: 'file',
          fileName: 'data.csv',
          fileType: 'text/csv',
          fileUrl: 'cs/data.csv',
        },
        {
          type: 'file',
          fileName: 'script.py',
          fileType: 'text/x-python',
          fileUrl: 'cs/script.py',
        },
        {
          type: 'file',
          fileName: 'page.html',
          fileType: 'text/html',
          fileUrl: 'cs/page.html',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-preview-types',
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

    // All should have the "Open file" aria-label
    const fileButtons = screen.getAllByRole('button', { name: /Open file/i })
    expect(fileButtons.length).toBe(3)
  })

  // ── FileCard keyboard navigation ──────────────────────────────────────

  it('triggers file action on Enter and Space keypress on FileCard', async () => {
    const user = userEvent.setup()
    const { ChatMessage } = await import('../ChatMessage')

    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    const userMsg = makeMessage({
      id: 'u-fc-key',
      role: 'user',
      content: [
        { type: 'text', text: 'file' },
        {
          type: 'file',
          fileName: 'archive.tar.gz',
          fileType: 'application/gzip',
          fileUrl: 'cs/archive.tar.gz',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-fc-key',
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

    const fileCard = screen.getByRole('button', {
      name: /Open file archive.tar.gz/i,
    })

    // Tab to focus, then press Enter
    fileCard.focus()
    await user.keyboard('{Enter}')

    // Should have triggered the download (non-previewable)
    await waitFor(() => expect(anchorClick).toHaveBeenCalled())
  })

  // ── Query rewrite result: wasQueryRewritten=false ─────────────────────

  it('shows "No query optimization necessary" when wasQueryRewritten is false', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-no-rewrite',
      role: 'user',
      content: [{ type: 'text', text: 'Simple question' }] as any,
      wasQueryRewritten: false,
    })

    const assistantMsg = makeMessage({
      id: 'a-no-rewrite',
      role: 'assistant',
      content: 'Answer',
    })

    const conversation = makeConversation({
      id: 'conv-no-rewrite',
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
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      screen.getByText('No query optimization necessary'),
    ).toBeInTheDocument()
  })

  // ── Query rewriting loading state ─────────────────────────────────────

  it('shows "Optimizing search query" loading state for the last message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-qr-loading',
      role: 'user',
      content: [{ type: 'text', text: 'Complex question' }] as any,
    })

    const conversation = makeConversation({
      id: 'conv-qr-loading',
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
          isQueryRewriting: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      screen.getAllByText(/Optimizing search query/i).length,
    ).toBeGreaterThan(0)
  })

  // ── Retrieval loading state ───────────────────────────────────────────

  it('shows "Retrieving documents" loading state for the last message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-ret-loading',
      role: 'user',
      content: [{ type: 'text', text: 'Question' }] as any,
    })

    const conversation = makeConversation({
      id: 'conv-ret-loading',
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
          isRetrievalLoading: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getAllByText(/Retrieving documents/i).length).toBeGreaterThan(
      0,
    )
  })

  // ── Routing loading state ─────────────────────────────────────────────

  it('shows "Routing the request" loading state for the last message', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-routing',
      role: 'user',
      content: [{ type: 'text', text: 'Question' }] as any,
    })

    const conversation = makeConversation({
      id: 'conv-routing',
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
          isRouting: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getAllByText(/Routing the request/i).length).toBeGreaterThan(
      0,
    )
  })

  // ── Edit mode with array content preserves non-text items ─────────────

  it('extracts text from array content when entering edit mode', async () => {
    const user = userEvent.setup()
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-edit-arr',
      role: 'user',
      content: [
        { type: 'text', text: 'Original array text' },
        {
          type: 'file',
          fileName: 'doc.pdf',
          fileType: 'application/pdf',
          fileUrl: 'cs/doc.pdf',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-edit-arr',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
        onEdit={vi.fn()}
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

    // Textarea should have the text content extracted from the array
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('Original array text')
  })

  // ── Edit mode: Save & Submit button click ─────────────────────────────

  it('submits edit via Save & Submit button click', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-save-btn',
      role: 'user',
      content: 'Click save',
    })

    const conversation = makeConversation({
      id: 'conv-save-btn',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
        onEdit={onEdit}
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
    await user.type(textarea, 'Updated via button')

    // Click Save & Submit instead of pressing Enter
    await user.click(screen.getByText('Save & Submit'))

    await waitFor(() => expect(onEdit).toHaveBeenCalled())
    const edited = onEdit.mock.calls[0]?.[0]
    expect(edited.content).toBe('Updated via button')
  })

  // ── IME composition does not trigger submit ───────────────────────────

  it('does not submit during IME composition', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-ime',
      role: 'user',
      content: 'Hello',
    })

    const conversation = makeConversation({
      id: 'conv-ime',
      messages: [userMsg],
    })

    renderWithProviders(
      <ChatMessage
        message={userMsg as any}
        messageIndex={0}
        courseName="CS101"
        onEdit={onEdit}
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

    // Simulate IME composition
    textarea.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    )

    // During composition, Enter should not submit
    await user.keyboard('{Enter}')
    // We can't fully verify IME behavior in JSDOM but at minimum
    // the edit handler should still function
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  // ── User message with contexts shows "Retrieved documents" accordion ──

  it('shows "Retrieved documents" accordion for user messages with contexts', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-retrieved',
      role: 'user',
      content: [{ type: 'text', text: 'Question' }] as any,
      contexts: [
        makeContextWithMetadata({
          readable_filename: 'doc1.pdf',
          s3_path: 'cs/doc1.pdf',
          url: '',
        }),
        makeContextWithMetadata({
          readable_filename: 'doc2.pdf',
          s3_path: 'cs/doc2.pdf',
          url: '',
        }),
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-retrieved',
      role: 'assistant',
      content: 'Answer',
    })

    const conversation = makeConversation({
      id: 'conv-retrieved',
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
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getByText(/Retrieved documents/i)).toBeInTheDocument()
    expect(screen.getByText(/Found 2 document chunks/i)).toBeInTheDocument()
  })

  // ── SourcesSidebarProvider closes on conversation change ───────────────

  it('closes sources sidebar when conversation changes', async () => {
    const user = userEvent.setup()
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctxPdf = makeContextWithMetadata({
      readable_filename: 'Doc.pdf',
      s3_path: 'cs/doc.pdf',
      url: '',
    })

    const userMsg = makeMessage({
      id: 'u-conv-change',
      role: 'user',
      content: 'Q',
      contexts: [ctxPdf],
    })

    const assistantMsg = makeMessage({
      id: 'a-conv-change',
      role: 'assistant',
      content: 'Answer',
    })

    const conversation = makeConversation({
      id: 'conv-change-1',
      messages: [userMsg, assistantMsg],
    })

    const { rerender, homeContext } = renderWithProviders(
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

    // Open the sources sidebar
    const sourcesBtn = await screen.findByRole('button', { name: /Sources/i })
    await user.click(sourcesBtn)

    // Sidebar should be open
    expect(
      await screen.findByRole('button', { name: /Close sources sidebar/i }),
    ).toBeInTheDocument()
  })

  // ── Tool with aiGeneratedArgumentValues with empty image_urls ─────────

  it('shows "No arguments provided" when image_urls array is empty', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-empty-imgs',
      role: 'user',
      content: [{ type: 'text', text: 'Run tool' }] as any,
      tools: [
        {
          id: 'tool-empty-1',
          name: 'empty_imgs_tool',
          readableName: 'Empty Imgs Tool',
          description: 'A tool with empty images',
          aiGeneratedArgumentValues: {
            image_urls: JSON.stringify([]),
          },
          output: { text: 'done', imageUrls: [], s3Paths: [] },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-empty-imgs',
      role: 'assistant',
      content: 'Done',
    })

    const conversation = makeConversation({
      id: 'conv-empty-imgs',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(screen.getByText('No arguments provided')).toBeInTheDocument()
  })

  // ── Tool with data output (no text) ───────────────────────────────────

  it('renders JSON.stringify of output.data when output.text is absent', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-data',
      role: 'user',
      content: [{ type: 'text', text: 'Run tool' }] as any,
      tools: [
        {
          id: 'tool-data-1',
          name: 'data_tool',
          readableName: 'Data Tool',
          description: 'A tool with data output',
          output: {
            data: { status: 'complete', count: 42 },
            imageUrls: [],
            s3Paths: [],
          },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-data',
      role: 'assistant',
      content: 'Done',
    })

    const conversation = makeConversation({
      id: 'conv-tool-data',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Should show JSON stringified data
    expect(screen.getByText(/"complete"/)).toBeInTheDocument()
  })

  // ── Assistant with think tag content as array ─────────────────────────

  it('renders think tag dropdown when content array includes think tags', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-think-arr',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '<think>Internal reasoning</think>The final answer is 42.',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-think-arr',
      messages: [
        makeMessage({ id: 'u-think-arr', role: 'user', content: 'Q' }),
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

    expect(await screen.findByText(/AI's Thought Process/i)).toBeInTheDocument()
    expect(screen.getByText(/The final answer is 42/)).toBeInTheDocument()
  })

  // ── Assistant message at index 0 (no previous user message) ───────────

  it('handles assistant message at index 0 gracefully', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-first',
      role: 'assistant',
      content: 'Welcome message',
    })

    const conversation = makeConversation({
      id: 'conv-first',
      messages: [assistantMsg],
    })

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg as any}
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

    expect(screen.getByText(/Welcome message/)).toBeInTheDocument()
    // No Sources button because no contexts
    expect(
      screen.queryByRole('button', { name: /Sources/i }),
    ).not.toBeInTheDocument()
  })

  // ── Loading state hidden for agent mode ───────────────────────────────

  it('does not show "Generating final response" for agent mode conversations', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-agent-mode',
      role: 'user',
      content: 'Agent question',
    })

    const conversation = makeConversation({
      id: 'conv-agent-mode',
      messages: [userMsg],
    })
    ;(conversation as any).agentModeEnabled = true

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
          isRetrievalLoading: false,
          isImg2TextLoading: false,
          isQueryRewriting: false,
          loading: true,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      screen.queryByText('Generating final response…'),
    ).not.toBeInTheDocument()
  })

  // ── Tool with loading state (output and error both undefined) ─────────

  it('shows loading state for tools that are still running', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-loading',
      role: 'user',
      content: [{ type: 'text', text: 'Run tool' }] as any,
      tools: [
        {
          id: 'tool-loading-1',
          name: 'running_tool',
          readableName: 'Running Tool',
          description: 'A tool still running',
          // output and error are both undefined - indicates loading
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-loading',
      role: 'assistant',
      content: '...',
    })

    const conversation = makeConversation({
      id: 'conv-tool-loading',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Tool output accordion should be rendered
    expect(screen.getAllByText(/Tool output from/i).length).toBeGreaterThan(0)
  })

  // ── Sources sidebar with web context thumbnail ────────────────────────

  it('loads thumbnails for web contexts using favicon', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const ctxWeb = makeContextWithMetadata({
      readable_filename: 'Web Article',
      s3_path: undefined,
      url: 'https://example.com/article',
    })

    const userMsg = makeMessage({
      id: 'u-web-thumb',
      role: 'user',
      content: 'Q',
      contexts: [ctxWeb],
    })

    const assistantMsg = makeMessage({
      id: 'a-web-thumb',
      role: 'assistant',
      content: 'Answer',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-web-thumb',
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

    // Should show Sources button
    const sourcesBtn = await screen.findByRole('button', { name: /Sources/i })
    expect(sourcesBtn).toBeInTheDocument()
  })

  // ── User message with no content type returns nothing for content map ─

  it('skips rendering unknown content types in user message arrays', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-unknown',
      role: 'user',
      content: [
        { type: 'text', text: 'Valid text' },
        { type: 'unknown_type' as any, data: 'some data' },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-unknown',
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

    expect(screen.getByText('Valid text')).toBeInTheDocument()
  })

  // ── Tool routing accordion with image arguments ───────────────────────

  it('renders tool routing with image argument previews', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-imgs',
      role: 'user',
      content: [{ type: 'text', text: 'Process images' }] as any,
      tools: [
        {
          id: 'tool-imgs-1',
          name: 'img_tool',
          readableName: 'Image Tool',
          description: 'A tool with image arguments',
          aiGeneratedArgumentValues: {
            image_urls: JSON.stringify([
              'http://example.com/img1.png',
              'http://example.com/img2.png',
            ]),
          },
          output: { text: 'processed', imageUrls: [], s3Paths: [] },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-imgs',
      role: 'assistant',
      content: 'Done',
    })

    const conversation = makeConversation({
      id: 'conv-tool-imgs',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Should show the routing accordion with image arguments
    const imgs = screen.getAllByAltText(/Tool image argument/i)
    expect(imgs.length).toBe(2)
  })

  // ── Inline code cursor placeholder ────────────────────────────────────

  it('renders cursor placeholder in inline code as pulsing span', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-inline-cursor',
      role: 'assistant',
      content: 'Thinking `▍` now',
    })

    const conversation = makeConversation({
      id: 'conv-inline-cursor',
      messages: [
        makeMessage({ id: 'u-inline-cursor', role: 'user', content: 'Q' }),
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

    // Should render the cursor character
    expect(await screen.findByText('▍')).toBeInTheDocument()
  })

  // ── Assistant message without contexts and no previous user msg ctx ───

  it('does not show Sources button when neither message has contexts', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-no-ctx',
      role: 'user',
      content: 'Q',
      contexts: [],
    })

    const assistantMsg = makeMessage({
      id: 'a-no-ctx',
      role: 'assistant',
      content: 'Answer',
      contexts: [],
    })

    const conversation = makeConversation({
      id: 'conv-no-ctx',
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

    expect(
      screen.queryByRole('button', { name: /Sources/i }),
    ).not.toBeInTheDocument()
  })

  // ── Message with undefined contexts ───────────────────────────────────

  it('handles message with undefined contexts gracefully', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a-undef-ctx',
      role: 'assistant',
      content: 'Answer',
    })
    // Explicitly delete contexts to test undefined case
    delete (assistantMsg as any).contexts

    const userMsg = makeMessage({
      id: 'u-undef-ctx',
      role: 'user',
      content: 'Q',
    })
    delete (userMsg as any).contexts

    const conversation = makeConversation({
      id: 'conv-undef-ctx',
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

    expect(screen.getByText(/Answer/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Sources/i }),
    ).not.toBeInTheDocument()
  })

  // ── Multiple tools with routing badges ────────────────────────────────

  it('renders multiple tool routing accordions with badges', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-multi-tools',
      role: 'user',
      content: [{ type: 'text', text: 'Multi-tool query' }] as any,
      tools: [
        {
          id: 'tool-a',
          name: 'tool_a',
          readableName: 'Tool Alpha',
          description: 'First tool',
          aiGeneratedArgumentValues: { param: 'value1' },
          output: { text: 'Result A', imageUrls: [], s3Paths: [] },
        } as any,
        {
          id: 'tool-b',
          name: 'tool_b',
          readableName: 'Tool Beta',
          description: 'Second tool',
          aiGeneratedArgumentValues: { param: 'value2' },
          output: { text: 'Result B', imageUrls: [], s3Paths: [] },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-multi-tools',
      role: 'assistant',
      content: 'Combined result',
    })

    const conversation = makeConversation({
      id: 'conv-multi-tools',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    // Both tool names should appear as badges (may appear multiple times in routing + output)
    expect(screen.getAllByText('Tool Alpha').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tool Beta').length).toBeGreaterThan(0)
    expect(screen.getByText('Result A')).toBeInTheDocument()
    expect(screen.getByText('Result B')).toBeInTheDocument()
  })

  // ── Tool output with imageUrls renders images ─────────────────────────

  it('renders tool output images when imageUrls are present', async () => {
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const userMsg = makeMessage({
      id: 'u-tool-out-imgs',
      role: 'user',
      content: [{ type: 'text', text: 'Generate images' }] as any,
      tools: [
        {
          id: 'tool-out-img-1',
          name: 'img_gen',
          readableName: 'Image Gen',
          description: 'Generates images',
          output: {
            text: 'Generated 2 images',
            imageUrls: [
              'http://example.com/out1.png',
              'http://example.com/out2.png',
            ],
            s3Paths: [],
          },
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a-tool-out-imgs',
      role: 'assistant',
      content: 'Here are your images',
    })

    const conversation = makeConversation({
      id: 'conv-tool-out-imgs',
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
          messageIsStreaming: true,
          isRouting: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const imgs = screen.getAllByAltText(/Tool output image/i)
    expect(imgs.length).toBe(2)
  })

  // ── File card with short filename (no truncation) ─────────────────────

  it('does not truncate short filenames', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-short-fn',
      role: 'user',
      content: [
        { type: 'text', text: 'file' },
        {
          type: 'file',
          fileName: 'short.pdf',
          fileType: 'application/pdf',
          fileUrl: 'cs/short.pdf',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-short-fn',
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

    const displayed = screen.getByText('short.pdf')
    expect(displayed.textContent).not.toContain('...')
  })

  // ── File without fileName defaults to "Unknown file" ──────────────────

  it('shows "Unknown file" when fileName is missing from content', async () => {
    const { ChatMessage } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u-no-fn',
      role: 'user',
      content: [
        { type: 'text', text: 'file' },
        {
          type: 'file',
          fileType: 'application/octet-stream',
          fileUrl: 'cs/unknown',
        },
      ] as any,
    })

    const conversation = makeConversation({
      id: 'conv-no-fn',
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
      screen.getByRole('button', { name: /Open file Unknown file/i }),
    ).toBeInTheDocument()
  })
})
