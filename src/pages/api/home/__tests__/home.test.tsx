import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@/services/errorService', () => ({
  default: () => ({
    getModelsError: () => ({ title: 'err', message: 'err' }),
  }),
}))

vi.mock('~/hooks/conversationQueries', () => ({
  useFetchConversationHistory: () => ({ data: [], isFetched: true, isLoading: false }),
  useFetchLastConversation: () => ({ data: { temperature: 0.3 }, isFetched: true, isLoading: false }),
  useUpdateConversation: () => ({ mutate: vi.fn() }),
}))

const hoistedState = vi.hoisted(() => ({
  folders: [
    { id: 'f1', name: 'Folder', type: 'chat', conversations: [] as any[] },
  ],
}))

vi.mock('~/hooks/folderQueries', () => ({
  useCreateFolder: () => ({ mutate: vi.fn() }),
  useUpdateFolder: () => ({ mutate: vi.fn() }),
  useDeleteFolder: () => ({ mutate: vi.fn() }),
  useFetchFolders: () => ({
    data: hoistedState.folders,
    isFetched: true,
    isLoading: false,
  }),
}))

vi.mock('~/components/UIUC-Components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
}))

vi.mock('~/components/UIUC-Components/MainPageBackground', () => ({
  MainPageBackground: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('~/components/UIUC-Components/navbars/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}))

vi.mock('@/components/Chatbar/Chatbar', async () => {
  const React = await import('react')
  const { useContext, useEffect } = React
  const { default: HomeContext } = await import('~/pages/api/home/home.context')
  return {
    Chatbar: () => {
      const ctx = useContext(HomeContext as any) as any
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
  return {
    Chat: (props: any) => {
      const ctx = useContext(HomeContext as any) as any
      useEffect(() => {
        const convo = ctx?.state?.selectedConversation
        if (!convo) return

        const msg = { id: 'm1', role: 'user', content: 'hi' }
        ctx.handleUpdateConversation(convo, { key: 'messages', value: [msg] })
        ctx.handleFeedbackUpdate({ ...convo, messages: [msg] }, { key: 'name', value: 'Renamed' })
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

import Home from '../home'

describe('pages/api/home/home (shared Home component)', () => {
  afterEach(() => cleanup())

  it('renders past initial setup and responds to drag events', async () => {
    localStorage.clear()

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url ?? String(input)
      if (String(url).includes('/api/models')) {
        return new Response(
          JSON.stringify({
            OpenAI: {
              enabled: true,
              models: [{ id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: true }],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    renderWithProviders(
      <Home
        current_email="u@example.com"
        course_metadata={{ is_private: false } as any}
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
    expect(await screen.findByText('Drop your image here!')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByText('Drop your image here!')).toBeNull()
    })

    fetchSpy.mockRestore()
  })

  it('covers localStorage quota fallback and other drag handlers', async () => {
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

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url ?? String(input)
      if (String(url).includes('/api/models')) {
        return new Response(
          JSON.stringify({
            OpenAI: {
              enabled: true,
              models: [{ id: 'gpt-4o', name: 'GPT-4o', enabled: true, default: true }],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    renderWithProviders(
      <Home
        current_email="u@example.com"
        course_metadata={{ is_private: false } as any}
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
    expect(await screen.findByText('Drop your image here!')).toBeInTheDocument()

    fireEvent.dragLeave(document, { relatedTarget: null })
    await waitFor(() => {
      expect(screen.queryByText('Drop your image here!')).toBeNull()
    })

    fireEvent.dragEnter(document)
    fireEvent.drop(document)
    await waitFor(() => {
      expect(screen.queryByText('Drop your image here!')).toBeNull()
    })

    fireEvent.dragEnter(document)
    fireEvent.mouseOut(window, { relatedTarget: null })
    await waitFor(() => {
      expect(screen.queryByText('Drop your image here!')).toBeNull()
    })

    setItemSpy.mockRestore()
    fetchSpy.mockRestore()
  })
})
