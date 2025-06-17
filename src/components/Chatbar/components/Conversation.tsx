import {
  IconCheck,
  IconMessage,
  IconPencil,
  IconTrash,
  IconX,
  IconDots,
  IconShare,
} from '@tabler/icons-react'
import {
  DragEvent,
  KeyboardEvent,
  MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Menu, UnstyledButton, createStyles, Modal, Text, Button, Group } from '@mantine/core'

import { Conversation } from '@/types/chat'

import HomeContext from '~/pages/api/home/home.context'

import SidebarActionButton from '@/components/Buttons/SidebarActionButton'
import ChatbarContext from '@/components/Chatbar/Chatbar.context'
import { useRouter } from 'next/router'

const useStyles = createStyles((theme) => ({
  menuDropdown: {
    backgroundColor: '#343541',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    color: theme.white,
    '&:hover': {
      backgroundColor: '#40414f',
    },
  },
  menuItemRed: {
    color: theme.colors.red[4],
    '&:hover': {
      backgroundColor: '#40414f',
    },
  },
  dotsButton: {
    color: theme.white,
    '&:hover': {
      color: theme.colors.gray[3],
    },
  },
  shareModal: {
    backgroundColor: '#343541',
    color: theme.white,
  },
  shareUrl: {
    backgroundColor: '#40414f',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    wordBreak: 'break-all',
  },
}))

interface Props {
  conversation: Conversation
}

export const ConversationComponent = ({ conversation }: Props) => {
  const { classes } = useStyles()
  const router = useRouter()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const {
    state: { selectedConversation, messageIsStreaming },
    handleSelectConversation,
    handleUpdateConversation,
  } = useContext(HomeContext)

  const { handleDeleteConversation } = useContext(ChatbarContext)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [customGPTName, setCustomGPTName] = useState<string>('')

  useEffect(() => {
    const fetchCustomGPTName = async () => {
      if (conversation.customGptId && conversation.projectName) {
        try {
          const response = await fetch(`/api/UIUC-api/getCourseMetadata?course_name=${encodeURIComponent(conversation.projectName)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.course_metadata?.custom_system_prompts) {
              const customGPT = data.course_metadata.custom_system_prompts.find(
                (p: { id: string }) => p.id === conversation.customGptId
              );
              if (customGPT) {
                setCustomGPTName(customGPT.name);
              }
            }
          } else {
            console.error('Failed to fetch course metadata:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching course metadata:', error);
        }
      }
    };

    fetchCustomGPTName();
  }, [conversation.customGptId, conversation.projectName]);

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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const baseUrl = window.location.origin
    const courseName = router.query.course_name
    const url = `${baseUrl}/${courseName}/chat?conversation=${conversation.id}&readonly=true`
    setShareUrl(url)
    setIsShareModalOpen(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here to show success
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false)
    } else if (isDeleting) {
      setIsRenaming(false)
    }
  }, [isRenaming, isDeleting])

  return (
    <>
      <div className="relative flex items-center">
        {isRenaming && selectedConversation?.id === conversation.id ? (
          <div className="flex w-full items-center gap-3 rounded-lg bg-[#343541]/90 p-3">
            <IconMessage size={18} />
            <input
              className="mr-12 flex-1 overflow-hidden overflow-ellipsis border-neutral-400 bg-transparent text-left text-[12.5px] leading-3 text-white outline-none focus:border-neutral-100"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleEnterDown}
              autoFocus
            />
          </div>
        ) : (
          <button
            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90 ${
              messageIsStreaming ? 'disabled:cursor-not-allowed' : ''
            } ${
              selectedConversation?.id === conversation.id
                ? 'bg-[#343541]/90'
                : ''
            }`}
            onClick={() => handleSelectConversation(conversation)}
            disabled={messageIsStreaming}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, conversation)}
          >
            <IconMessage size={18} />
            <div
              className={`relative flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3 ${
                selectedConversation?.id === conversation.id ? 'pr-12' : 'pr-1'
              }`}
            >
              {conversation.name}
              {customGPTName && (
                <div className="text-xs text-gray-400">{customGPTName}</div>
              )}
            </div>
          </button>
        )}

        {(isDeleting || isRenaming) &&
          selectedConversation?.id === conversation.id && (
            <div className="absolute right-1 z-10 flex text-gray-300">
              <SidebarActionButton handleClick={handleConfirm}>
                <IconCheck size={18} />
              </SidebarActionButton>
              <SidebarActionButton handleClick={handleCancel}>
                <IconX size={18} />
              </SidebarActionButton>
            </div>
          )}

        {selectedConversation?.id === conversation.id &&
          !isDeleting &&
          !isRenaming && (
            <div className="absolute right-1 z-10 flex text-gray-300">
              <Menu 
                shadow="md" 
                width={200} 
                position="bottom-end"
                offset={5}
                classNames={{
                  dropdown: classes.menuDropdown,
                  item: classes.menuItem,
                }}
              >
                <Menu.Target>
                  <UnstyledButton className={classes.dotsButton}>
                    <IconDots size={18} />
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    icon={<IconPencil size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRenameModal(e);
                    }}
                  >
                    Rename
                  </Menu.Item>
                  <Menu.Item
                    icon={<IconShare size={16} />}
                    onClick={handleShare}
                  >
                    Share
                  </Menu.Item>
                  <Menu.Item
                    icon={<IconTrash size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteModal(e);
                    }}
                    className={classes.menuItemRed}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          )}
      </div>

      <Modal
        opened={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Conversation"
        classNames={{
          root: classes.shareModal,
          header: classes.menuItem,
        }}
      >
        <Text size="sm" mb="md" color="dimmed">
          Share this conversation with others by copying the link below:
        </Text>
        <div className={classes.shareUrl}>
          {shareUrl}
        </div>
        <Group position="right" mt="md">
          <Button onClick={copyToClipboard}>
            Copy Link
          </Button>
        </Group>
      </Modal>
    </>
  )
}
