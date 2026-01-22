import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../UIUC-Components/SourcesSidebar', () => ({
  __esModule: true,
  default: (props: any) => {
    const anyOpen = props.hideRightSidebarIcon?.()
    return (
      <div>
        <div>Mock Sources Sidebar</div>
        <div data-testid="any-sidebar-open">{String(!!anyOpen)}</div>
        <button type="button" onClick={props.onClose} aria-label="Close sources sidebar">
          Close sources sidebar
        </button>
      </div>
    )
  },
}))

describe('ChatMessage (markdown coverage)', () => {
  it('renders headings, lists, tables, and code blocks', async () => {
    vi.resetModules()
    const { renderWithProviders } = await import('~/test-utils/renderWithProviders')
    const { makeConversation, makeMessage } = await import('~/test-utils/mocks/chat')
    const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'Q',
      contexts: [
        {
          readable_filename: 'notes.rtf',
          s3_path: 'cs101/notes.rtf',
          url: '',
        } as any,
      ],
    })

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: [
        '# Heading 1',
        '## Heading 2',
        '',
        '- Item 1',
        '- Item 2',
        '',
        '1. First',
        '2. Second',
        '',
        '| a | b |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        'Inline cursor `▍` and a real code block:',
        '',
        '```js',
        "console.log('x')",
        '```',
      ].join('\n'),
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
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: false,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(await screen.findByText('Heading 1')).toBeInTheDocument()
    expect(screen.getByText('Heading 2')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText(/Inline cursor/i)).toBeInTheDocument()
    expect(screen.getByText('▍')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copy code/i })).toBeInTheDocument()
  })

  it('opens and closes the sources sidebar and executes hideRightSidebarIcon', async () => {
    vi.resetModules()
    const user = userEvent.setup()
    const { renderWithProviders } = await import('~/test-utils/renderWithProviders')
    const { makeConversation, makeMessage } = await import('~/test-utils/mocks/chat')
    const { ChatMessage, SourcesSidebarProvider } = await import('../ChatMessage')

    const ctxPdfUser = {
      readable_filename: 'Lecture1.pdf',
      s3_path: 'cs101/lecture1.pdf',
      url: '',
    } as any

    const userMsg = makeMessage({
      id: 'u1',
      role: 'user',
      content: 'Question',
      contexts: [ctxPdfUser],
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

    renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage message={assistantMsg as any} messageIndex={1} courseName="CS101" />
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

    await user.click(await screen.findByRole('button', { name: /Sources/i }))
    expect(await screen.findByText('Mock Sources Sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('any-sidebar-open')).toHaveTextContent('true')

    await user.click(screen.getByRole('button', { name: /Close sources sidebar/i }))
    expect(screen.queryByText('Mock Sources Sidebar')).not.toBeInTheDocument()
  })
})
