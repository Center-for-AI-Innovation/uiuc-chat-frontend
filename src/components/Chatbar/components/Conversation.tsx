import {
  IconCheck,
  IconMessage,
  IconPencil,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react'

import { type Conversation } from '@/types/chat'

import HomeContext from '~/pages/api/home/home.context'

import SidebarActionButton from '@/components/Buttons/SidebarActionButton'
import ChatbarContext from '@/components/Chatbar/Chatbar.context'

interface Props {
  conversation: Conversation
}

export const ConversationComponent = ({ conversation }: Props) => {
  const {
    state: { selectedConversation, messageIsStreaming },
    handleSelectConversation,
    handleUpdateConversation,
  } = useContext(HomeContext)

  const courseName = conversation.projectName

  const { handleDeleteConversation } = useContext(ChatbarContext)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      selectedConversation && handleRename(selectedConversation)
    }
  }

  const handleDragStart = (
    e: DragEvent<HTMLButtonElement>,
    conversation: Conversation,
  ) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('conversation', JSON.stringify(conversation))
    }
  }

  const handleRename = (conversation: Conversation) => {
    if (renameValue.trim().length > 0) {
      handleUpdateConversation(conversation, {
        key: 'name',
        value: renameValue,
      })
      setRenameValue('')
      setIsRenaming(false)
    }
  }

  const handleConfirm: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    if (isDeleting) {
      handleDeleteConversation(conversation)
    } else if (isRenaming) {
      handleRename(conversation)
    }
    setIsDeleting(false)
    setIsRenaming(false)
  }

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setIsDeleting(false)
    setIsRenaming(false)
  }

  const handleOpenRenameModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setIsRenaming(true)
    selectedConversation && setRenameValue(selectedConversation.name)
  }
  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setIsDeleting(true)
  }

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false)
    } else if (isDeleting) {
      setIsRenaming(false)
    }
  }, [isRenaming, isDeleting])

  return (
    <div className="relative flex items-start text-[--sidebar]">
      {isRenaming && selectedConversation?.id === conversation.id ? (
        <div
          className={`flex w-full items-start gap-3 rounded-lg p-3
          ${
            selectedConversation?.id === conversation.id
              ? 'border border-[--sidebar-selected]'
              : ''
          }
        `}
        >
          <IconMessage size={16} className="text-[--sidebar]" />
          <input
            className="mr-12 flex-1 overflow-hidden overflow-ellipsis border-0 bg-transparent text-left text-[.75rem] leading-3 text-[--sidebar] outline-none"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleEnterDown}
            autoFocus
          />
        </div>
      ) : (
        <button
          className={`flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-[.75rem] transition-colors duration-200 ${
            messageIsStreaming ? 'disabled:cursor-not-allowed' : ''
          } ${
            selectedConversation?.id === conversation.id
              ? 'border border-[--sidebar-selected] bg-[--sidebar-selected]'
              : 'hover:bg-white/10'
          }`}
          onClick={() => handleSelectConversation(conversation)}
          disabled={messageIsStreaming}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, conversation)}
        >
          <IconMessage size={16} className="text-[--sidebar]" />
          {/* <div
            className={`relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3 ${selectedConversation?.id === conversation.id ? 'pr-12' : 'pr-1'
              }`}
          > */}
          <div
            className={`relative flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left leading-3 ${
              selectedConversation?.id === conversation.id ? 'pr-12' : 'pr-1'
            }`}
          >
            {conversation.name}
            {/* Add a new div to display the course_name */}
            {courseName && (
              <div className="text-xs opacity-50">{courseName.trim()}</div>
            )}
          </div>
        </button>
      )}

      {(isDeleting || isRenaming) &&
        selectedConversation?.id === conversation.id && (
          <div className="absolute right-1 top-[.5rem] z-10 flex">
            <SidebarActionButton handleClick={handleConfirm}>
              <IconCheck
                size={16}
                className="text-[--sidebar] opacity-50 hover:opacity-100"
              />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleCancel}>
              <IconX
                size={16}
                className="text-[--sidebar] opacity-50 hover:opacity-100"
              />
            </SidebarActionButton>
          </div>
        )}

      {selectedConversation?.id === conversation.id &&
        !isDeleting &&
        !isRenaming && (
          <div className="absolute right-1 top-[.5rem] z-10 flex">
            <SidebarActionButton handleClick={handleOpenRenameModal}>
              <IconPencil
                size={16}
                className="text-[--sidebar] opacity-50 hover:opacity-100"
              />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleOpenDeleteModal}>
              <IconTrash
                size={16}
                className="text-[--sidebar] opacity-50 hover:opacity-100"
              />
            </SidebarActionButton>
          </div>
        )}
    </div>
  )
}
