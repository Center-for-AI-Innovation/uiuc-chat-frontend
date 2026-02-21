import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation } from '~/test-utils/mocks/chat'
import { ChatFolders } from '../ChatFolders'

const mutateMock = vi.fn()
vi.mock('@/hooks/queries/useUpdateConversation', () => ({
  useUpdateConversation: () => ({ mutate: mutateMock, mutateAsync: vi.fn() }),
}))

vi.mock('framer-motion', () => ({
  motion: { div: (props: any) => React.createElement('div', props) },
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
}))

describe('ChatFolders', () => {
  it('renders chat-type folders sorted by name with conversations', () => {
    const handleUpdateConversation = vi.fn()
    const folders = [
      { id: 'f2', name: 'Beta', type: 'chat', conversations: [] },
      {
        id: 'f1',
        name: 'Alpha',
        type: 'chat',
        conversations: [
          makeConversation({
            id: 'c1',
            name: 'In Alpha',
            projectName: 'CS101',
          }) as any,
        ],
      },
      { id: 'f3', name: 'Other', type: 'prompt', conversations: [] },
    ] as any[]

    renderWithProviders(
      <ChatFolders
        searchTerm=""
        currentEmail="user@test.com"
        courseName="CS101"
      />,
      {
        homeState: { folders, conversations: [] },
        homeContext: { handleUpdateConversation } as any,
      },
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText(/Other/i)).not.toBeInTheDocument()
  })

  it('calls handleUpdateConversation and mutate when conversation is dropped on folder', () => {
    const handleUpdateConversation = vi.fn()
    const conv = makeConversation({
      id: 'c1',
      name: 'Conv 1',
      projectName: 'CS101',
      messages: [],
    }) as any
    const folder = {
      id: 'f1',
      name: 'Folder 1',
      type: 'chat',
      conversations: [],
    } as any

    renderWithProviders(
      <ChatFolders
        searchTerm="x"
        currentEmail="user@test.com"
        courseName="CS101"
      />,
      {
        homeState: { folders: [folder], conversations: [conv] },
        homeContext: { handleUpdateConversation } as any,
      },
    )

    const folderButton = screen.getByText('Folder 1').closest('button')!
    const dataTransfer = { getData: vi.fn(() => JSON.stringify(conv)) }
    const dropEvent = new Event('drop', { bubbles: true })
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer })
    folderButton.dispatchEvent(dropEvent)

    expect(handleUpdateConversation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', folderId: 'f1' }),
      { key: 'folderId', value: 'f1' },
    )
    expect(mutateMock).toHaveBeenCalled()
  })
})
