import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'

vi.mock('@/services/errorService', () => ({
  default: () => ({
    getModelsError: () => ({ title: 'err', message: 'err' }),
  }),
}))

vi.mock('~/components/UIUC-Components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
}))

vi.mock('~/components/UIUC-Components/MainPageBackground', () => ({
  MainPageBackground: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock('~/components/UIUC-Components/navbars/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}))

vi.mock('@/components/Chatbar/Chatbar', async () => {
  const React = await import('react')
  const { useContext, useEffect } = React
  const { default: HomeContext } = await import('~/pages/api/home/home.context')

  type ChatbarCtx = {
    state?: { folders?: Array<{ id: string }> }
    handleUpdateFolder: (id: string, name: string) => void
    handleDeleteFolder: (id: string) => void
    handleCreateFolder: (name: string, type: string) => void
  }

  return {
    Chatbar: () => {
      const ctx = useContext(
        HomeContext as unknown as React.Context<unknown>,
      ) as ChatbarCtx
      useEffect(() => {
        const folderId = ctx?.state?.folders?.[0]?.id
        if (folderId) {
          ctx.handleUpdateFolder(folderId, 'Renamed')
          ctx.handleDeleteFolder(folderId)
        }
        ctx.handleCreateFolder('New Folder', 'chat')
      }, [ctx?.state?.folders?.length])
      return React.createElement('div', { 'data-testid': 'chatbar' })
    },
  }
})

vi.mock('@/components/Chat/Chat', async () => {
  const React = await import('react')
  const { useContext, useEffect } = React
  const { default: HomeContext } = await import('~/pages/api/home/home.context')

  type ChatCtx = {
    state?: { selectedConversation?: { id: string } }
    handleUpdateConversation: (
      conversation: unknown,
      data: { key: string; value: unknown },
    ) => void
    handleFeedbackUpdate: (
      conversation: unknown,
      data: { key: string; value: unknown },
    ) => void
    handleSelectConversation: (conversation: unknown) => void
    setIsRouting: (v: boolean) => void
    setIsRetrievalLoading: (v: boolean) => void
    setIsImg2TextLoading: (v: boolean) => void
    setIsQueryRewriting: (v: boolean) => void
    setQueryRewriteResult: (v: string) => void
    handleUpdateDocumentGroups: (id: string) => void
    handleUpdateTools: (id: string) => void
  }

  return {
    Chat: (props: { courseName?: string }) => {
      const ctx = useContext(
        HomeContext as unknown as React.Context<unknown>,
      ) as ChatCtx
      useEffect(() => {
        const convo = ctx?.state?.selectedConversation
        if (!convo) return

        const msg = { id: 'm1', role: 'user', content: 'hi' }
        ctx.handleUpdateConversation(convo, { key: 'messages', value: [msg] })
        ctx.handleFeedbackUpdate(
          { ...convo, messages: [msg] },
          { key: 'name', value: 'Renamed' },
        )
        ctx.handleSelectConversation({ ...convo, messages: [msg] })
        ctx.setIsRouting(true)
        ctx.setIsRetrievalLoading(true)
        ctx.setIsImg2TextLoading(true)
        ctx.setIsQueryRewriting(true)
        ctx.setQueryRewriteResult('result')
        ctx.handleUpdateDocumentGroups('dg')
        ctx.handleUpdateTools('tool')
      }, [ctx?.state?.selectedConversation?.id])
      return React.createElement('div', {
        'data-testid': 'chat',
        'data-course': props?.courseName ?? '',
      })
    },
  }
})

import Home from '~/pages/api/home/home'

describe('pages/api/home/home (shared Home component)', () => {
  afterEach(() => cleanup())

  const installFetchMock = () =>
    vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url =
          typeof input === 'string' ? input : (input?.url ?? String(input))

        if (String(url).includes('/api/models')) {
          return new Response(
            JSON.stringify({
              OpenAI: {
                enabled: true,
                models: [
                  {
                    id: 'gpt-4o',
                    name: 'GPT-4o',
                    enabled: true,
                    default: true,
                  },
                ],
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }

        if (String(url).includes('/api/folder')) {
          return new Response(
            JSON.stringify([
              { id: 'f1', name: 'Folder', type: 'chat', conversations: [] },
            ]),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }

        if (String(url).includes('/api/conversation')) {
          return new Response(
            JSON.stringify({ conversations: [], nextCursor: null }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }

        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      })

  it('renders past initial setup', async () => {
    localStorage.clear()

    const fetchSpy = installFetchMock()

    renderWithProviders(
      <Home
        current_email="u@example.com"
        course_metadata={{ is_private: false } as unknown as CourseMetadata}
        course_name="CS101"
        document_count={0}
        link_parameters={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />,
    )

    await screen.findByTestId('chat')
    await screen.findByTestId('chatbar')

    fireEvent.dragEnter(document)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Drop your image here!')).toBeNull()

    fetchSpy.mockRestore()
  })

  it('covers localStorage quota fallback', async () => {
    localStorage.clear()
    window.innerWidth = 500

    const originalSetItem = Storage.prototype.setItem
    let selectedConversationWrites = 0
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(function (key: string, value: string) {
        if (key === 'selectedConversation') {
          selectedConversationWrites += 1
          if (selectedConversationWrites === 2) {
            throw new DOMException('quota', 'QuotaExceededError')
          }
        }
        return originalSetItem.call(this, key, value)
      })

    const fetchSpy = installFetchMock()

    renderWithProviders(
      <Home
        current_email="u@example.com"
        course_metadata={{ is_private: false } as unknown as CourseMetadata}
        course_name="CS101"
        document_count={0}
        link_parameters={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />,
    )

    await screen.findByTestId('chat')

    fireEvent.dragEnter(document)
    fireEvent.dragOver(document)
    expect(screen.getByText('Drop your image here!')).toBeInTheDocument()

    fireEvent.dragLeave(document, { relatedTarget: null })
    expect(screen.queryByText('Drop your image here!')).toBeNull()

    fireEvent.dragEnter(document)
    fireEvent.drop(document)
    expect(screen.queryByText('Drop your image here!')).toBeNull()

    fireEvent.dragEnter(document)
    fireEvent.mouseOut(window, { relatedTarget: null })
    expect(screen.queryByText('Drop your image here!')).toBeNull()

    setItemSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  it('covers quota fallback when minimal save also fails', async () => {
    localStorage.clear()
    window.innerWidth = 800

    const originalSetItem = Storage.prototype.setItem
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(function (key: string, value: string) {
        if (key === 'selectedConversation') {
          throw new DOMException('quota', 'QuotaExceededError')
        }
        return originalSetItem.call(this, key, value)
      })

    const fetchSpy = installFetchMock()

    renderWithProviders(
      <Home
        current_email="u@example.com"
        course_metadata={{ is_private: false } as unknown as CourseMetadata}
        course_name="CS101"
        document_count={0}
        link_parameters={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />,
    )

    await screen.findByTestId('chat')

    setItemSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  it('uses a recent selectedConversation from localStorage and honors showChatbar preference', async () => {
    localStorage.clear()
    window.innerWidth = 800
    localStorage.setItem('showChatbar', 'true')
    localStorage.setItem(
      'selectedConversation',
      JSON.stringify({
        id: 'c-saved',
        name: 'Saved',
        messages: [],
        model: { id: 'gpt-4o', name: 'GPT-4o', enabled: true },
        prompt: '',
        temperature: 0.2,
        folderId: null,
        userEmail: 'u@example.com',
        projectName: 'CS101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    )

    // Also cover invalid local API key branch (when no course openai_api_key is set).
    localStorage.setItem('apiKey', 'not-an-openai-key')

    const fetchSpy = installFetchMock()

    renderWithProviders(
      <Home
        current_email="u@example.com"
        course_metadata={{ is_private: false } as unknown as CourseMetadata}
        course_name="CS101"
        document_count={0}
        link_parameters={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />,
    )

    await screen.findByTestId('chat')
    await screen.findByTestId('chatbar')

    fetchSpy.mockRestore()
  })
})
