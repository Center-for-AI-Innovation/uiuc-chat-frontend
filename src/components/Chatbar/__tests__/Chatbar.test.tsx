import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation } from '~/test-utils/mocks/chat'
import { Chatbar } from '../Chatbar'

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

const mocks = vi.hoisted(() => ({
  deleteConversationMutate: vi.fn(),
  deleteAllConversationsMutate: vi.fn(),
  refetchConversationHistory: vi.fn(),
  fetchNextPageConversationHistory: vi.fn(),
  hasNextPageConversationHistory: false,
  isFetchingNextPageConversationHistory: false,
  saveConversationToServer: vi.fn(async () => ({})),
}))

vi.mock('@/hooks/queries/useDeleteConversation', () => ({
  useDeleteConversation: () => ({ mutate: mocks.deleteConversationMutate }),
}))

vi.mock('@/hooks/queries/useDeleteAllConversations', () => ({
  useDeleteAllConversations: () => ({
    mutate: mocks.deleteAllConversationsMutate,
  }),
}))

vi.mock('@/hooks/queries/useUpdateConversation', () => ({
  useUpdateConversation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}))

vi.mock('@/hooks/queries/useFetchConversationHistory', () => ({
  useFetchConversationHistory: () => ({
    data: { pages: [[]] },
    error: null,
    isLoading: false,
    isFetched: true,
    fetchNextPage: mocks.fetchNextPageConversationHistory,
    hasNextPage: mocks.hasNextPageConversationHistory,
    isFetchingNextPage: mocks.isFetchingNextPageConversationHistory,
    refetch: mocks.refetchConversationHistory,
  }),
}))

vi.mock('@/hooks/__internal__/conversation', () => ({
  saveConversationToServer: mocks.saveConversationToServer,
}))

describe('Chatbar', () => {
  it('renders a loading shell when missing email or courseName', () => {
    renderWithProviders(
      <Chatbar
        current_email={undefined}
        courseName="CS101"
        courseMetadata={null}
      />,
      { homeContext: { dispatch: vi.fn() } as any },
    )
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('migrates conversations from localStorage when needed', async () => {
    const conversation = makeConversation({
      id: 'c1',
      name: 'From localStorage',
      projectName: 'CS101',
      messages: [],
    } as any) as any

    localStorage.removeItem('convoMigrationComplete')
    localStorage.setItem('conversationHistory', JSON.stringify([conversation]))

    renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleNewConversation: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true, conversations: [], folders: [] } as any,
      },
    )

    await waitFor(() =>
      expect(mocks.saveConversationToServer).toHaveBeenCalled(),
    )
    expect(localStorage.getItem('convoMigrationComplete')).toBe('true')
  })

  it('clears conversations via ChatbarSettings', async () => {
    const user = userEvent.setup()
    const handleNewConversation = vi.fn()
    const dispatch = vi.fn()

    const conversation = makeConversation({
      id: 'c1',
      name: 'To clear',
      projectName: 'CS101',
    } as any) as any

    const { container } = renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch,
          handleNewConversation,
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true, conversations: [conversation] } as any,
      },
    )

    await user.click(screen.getByText(/Clear conversations/i))
    expect(await screen.findByText(/Are you sure/i)).toBeInTheDocument()

    const textEl = screen.getByText(/Are you sure/i)
    const row = textEl.parentElement as HTMLElement
    expect(row).toBeTruthy()
    const icons = row.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(3)
    // Icon order: trash, check, x
    await user.click(icons[1] as any)

    expect(mocks.deleteAllConversationsMutate).toHaveBeenCalled()
    expect(handleNewConversation).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ field: 'conversations', value: [] })
  })

  it('exports conversation history (JSON response branch)', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/downloadConvoHistoryUser')) {
        return new Response(JSON.stringify({ response: 'Download from S3' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch: vi.fn(),
          handleNewConversation: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true } as any,
      },
    )

    await user.click(screen.getByText(/Export history/i))
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('exports conversation history (ZIP download branch)', async () => {
    const user = userEvent.setup()

    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    const createObjectURL = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:download')
    const revokeObjectURL = vi
      .spyOn(window.URL, 'revokeObjectURL')
      .mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(new Blob(['zip-content']), {
        status: 200,
        headers: { 'content-type': 'application/zip' },
      }),
    )

    renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch: vi.fn(),
          handleNewConversation: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true } as any,
      },
    )

    await user.click(screen.getByText(/Export history/i))
    await waitFor(() => expect(anchorClick).toHaveBeenCalled())
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
  })

  it('handles server errors during export', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    )

    renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch: vi.fn(),
          handleNewConversation: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true } as any,
      },
    )

    await user.click(screen.getByText(/Export history/i))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
  })

  it('handles network errors during export', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch: vi.fn(),
          handleNewConversation: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true } as any,
      },
    )

    // Set up rejection after mount fetches complete.
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(
      new TypeError('fetch failed'),
    )

    await user.click(screen.getByText(/Export history/i))
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('downloadConvoHistoryUser'),
        expect.anything(),
      ),
    )
  })

  it('updates the OpenAI API key via ChatbarSettings', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()

    renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch,
          handleNewConversation: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: {
          showChatbar: true,
          apiKey: '',
          serverSideApiKeyIsSet: false,
          conversations: [],
          folders: [],
        } as any,
      },
    )

    await user.click(
      await screen.findByRole('button', { name: /OpenAI API Key/i }),
    )
    const input = screen.getByPlaceholderText(/API Key/i)
    await user.type(input, ' test-key {Enter}')

    expect(dispatch).toHaveBeenCalledWith({
      field: 'apiKey',
      value: 'test-key',
    })
    expect(localStorage.getItem('apiKey')).toBe('test-key')
  })

  it('loads more conversations when scrolling near the bottom', async () => {
    const dispatch = vi.fn()
    mocks.hasNextPageConversationHistory = true
    mocks.isFetchingNextPageConversationHistory = false
    mocks.fetchNextPageConversationHistory.mockClear()

    const { container } = renderWithProviders(
      <Chatbar
        current_email="owner@example.com"
        courseName="CS101"
        courseMetadata={null}
      />,
      {
        homeContext: {
          dispatch,
          handleNewConversation: vi.fn(),
          handleCreateFolder: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
        homeState: { showChatbar: true, conversations: [], folders: [] } as any,
      },
    )

    const scrollEl = container.querySelector(
      '.flex-grow.overflow-auto',
    ) as HTMLElement
    expect(scrollEl).toBeTruthy()

    Object.defineProperty(scrollEl, 'scrollHeight', {
      value: 1000,
      configurable: true,
    })
    Object.defineProperty(scrollEl, 'clientHeight', {
      value: 200,
      configurable: true,
    })
    Object.defineProperty(scrollEl, 'scrollTop', {
      value: 850,
      configurable: true,
    })

    scrollEl.dispatchEvent(new Event('scroll', { bubbles: true }))
    await waitFor(() =>
      expect(mocks.fetchNextPageConversationHistory).toHaveBeenCalled(),
    )

    mocks.hasNextPageConversationHistory = false
  })
})
