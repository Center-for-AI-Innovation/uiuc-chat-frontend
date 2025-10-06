// ChatMessage.tsx
import React, {
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext as useReactContext,
} from 'react'
import {
  Text,
  createStyles,
  Badge,
  Tooltip,
  Modal,
  Button,
} from '@mantine/core'
import {
  IconCheck,
  IconEdit,
  IconRobot,
  IconUser,
  IconX,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypeTxt,
  IconFileTypeXls,
  IconFileTypePpt,
  IconFile,
  IconEye,
} from '@tabler/icons-react'

import {
  type Content,
  type ContextWithMetadata,
  type Message,
  type MessageType,
} from '@/types/chat'
import { useTranslation } from 'next-i18next'
import HomeContext from '~/pages/api/home/home.context'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import { CodeBlock } from '../Markdown/CodeBlock'
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'
import SourcesSidebar from '../UIUC-Components/SourcesSidebar'
import { ImagePreview } from './ImagePreview'
import MessageActions from './MessageActions'
import ThinkTagDropdown, { extractThinkTagContent } from './ThinkTagDropdown'

import { saveConversationToServer } from '@/utils/app/conversation'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { IntermediateStateAccordion } from '../UIUC-Components/IntermediateStateAccordion'
import { FeedbackModal } from './FeedbackModal'

const useStyles = createStyles((theme) => ({
  imageContainerStyle: {
    maxWidth: '25%',
    flex: '1 0 21%',
    padding: '0.5rem',
    borderRadius: '0.5rem',
  },
  imageStyle: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    borderColor: 'var(--dashboard-border)',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
}))

// Component that's the Timer for GPT's response duration.
const Timer: React.FC<{ timerVisible: boolean }> = ({ timerVisible }) => {
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerVisible) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerVisible])

  return timer > 0 ? (
    <Text fz="sm" c="dimmed" mt="sm">
      {timer} s.
    </Text>
  ) : (
    <></>
  )
}
// File Card Component
const FileCard: React.FC<{
  fileName: string
  fileType?: string
  fileUrl?: string
  onClick: () => void
  isPreviewable?: boolean
}> = ({ fileName, fileType, fileUrl, onClick, isPreviewable = true }) => {
  const getFileIcon = (name: string, type?: string) => {
    const extension = name.split('.').pop()?.toLowerCase()
    const iconProps = { size: 20 }

    if (type?.includes('pdf') || extension === 'pdf') {
      return <IconFileTypePdf {...iconProps} style={{ color: 'var(--illinois-orange)' }} />
    }
    if (type?.includes('doc') || extension === 'docx' || extension === 'doc') {
      return <IconFileTypeDocx {...iconProps} style={{ color: 'var(--illinois-orange)' }} />
    }
    if (type?.includes('text') || extension === 'txt') {
      return <IconFileTypeTxt {...iconProps} style={{ color: 'var(--illinois-orange)' }} />
    }
    return <IconFile {...iconProps} style={{ color: 'var(--illinois-orange)' }} />
  }

  const truncateFileName = (name: string, maxLength = 30) => {
    if (name.length <= maxLength) return name
    const extension = name.split('.').pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
    const truncated =
      nameWithoutExt.substring(0, maxLength - (extension?.length || 0) - 4) +
      '...'
    return `${truncated}.${extension}`
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        maxWidth: '320px',
        cursor: 'pointer',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--background-faded)',
        padding: '8px 12px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.backgroundColor = 'var(--background-dark)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.backgroundColor = 'var(--background-faded)'
      }}
    >
      {getFileIcon(fileName, fileType)}
      <span 
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--foreground)',
        }}
      >
        {truncateFileName(fileName)}
      </span>
      {isPreviewable ? (
        <IconEye size={16} style={{ color: 'var(--illinois-orange)' }} />
      ) : (
        <IconFile size={16} style={{ color: 'var(--illinois-orange)' }} />
      )}
    </div>
  )
}

// File Preview Modal Component
const FilePreviewModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  fileName: string
  fileUrl?: string
  fileType?: string
  courseName: string
}> = ({ isOpen, onClose, fileName, fileUrl, fileType, courseName }) => {
  const { t } = useTranslation('chat')
  const { activeSidebarMessageId, setActiveSidebarMessageId } = useReactContext(
    SourcesSidebarContext,
  )

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      isImg2TextLoading,
      isRouting,
      isRunningTool,
      isRetrievalLoading,
      isQueryRewriting,
      loading,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const [actualFileUrl, setActualFileUrl] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')

  // Handle PDFs and Office documents that can be displayed in iframes
  const isPdf =
    fileType?.includes('pdf') || 
    fileName.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)
  const isTextFile =
    fileType?.includes('text') ||
    fileName.toLowerCase().match(/\.(txt|md|html|xml|csv|py|srt|vtt)$/i)

  useEffect(() => {
    if (fileUrl && isOpen) {
      // Convert S3 key to presigned URL
      fetchPresignedUrl(fileUrl, courseName).then((url) => {
        setActualFileUrl(url || '')
      })
    }
  }, [fileUrl, isOpen, courseName])

  // Load text content for text files
  useEffect(() => {
    if (isTextFile && actualFileUrl && isOpen) {
      fetch(actualFileUrl)
        .then(response => response.text())
        .then(text => setTextContent(text))
        .catch(error => {
          console.error('Failed to load text content:', error)
          setTextContent('Failed to load file content')
        })
    }
  }, [isTextFile, actualFileUrl, isOpen])

  // Don't render modal for non-previewable files
  if (isOpen && !isPdf && !isTextFile) {
    return null
  }

  return (
    <Modal.Root opened={isOpen} onClose={onClose} centered size="xl">
      <Modal.Overlay className="modal-overlay-common" />
      <Modal.Content className="modal-common">
        <Modal.Header className="modal-header-common">
          <Modal.Title className={`modal-title-common ${montserrat_heading.variable} font-montserratHeading`}>
            {fileName}
          </Modal.Title>
          <Modal.CloseButton
            onClick={onClose}
            aria-label="Close file preview"
            className="modal-close-button-common"
          />
        </Modal.Header>
        <Modal.Body className="modal-body-common">
          <div className="file-preview-container">
            {isPdf && actualFileUrl ? (
              <iframe
                src={actualFileUrl}
                className="file-preview-iframe"
                title={fileName}
              />
            ) : isTextFile && actualFileUrl ? (
              <div className="file-preview-text">
                <pre>{textContent}</pre>
              </div>
            ) : null}
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}



// Add context for managing the active sources sidebar
const SourcesSidebarContext = createContext<{
  activeSidebarMessageId: string | null
  setActiveSidebarMessageId: (id: string | null) => void
}>({
  activeSidebarMessageId: null,
  setActiveSidebarMessageId: () => {},
})

export const SourcesSidebarProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [activeSidebarMessageId, setActiveSidebarMessageId] = useState<
    string | null
  >(null)

  // Close sidebar when conversations change by listening to context changes
  const {
    state: { selectedConversation },
  } = useContext(HomeContext)

  useEffect(() => {
    // Close sidebar when conversation changes
    setActiveSidebarMessageId(null)
  }, [selectedConversation?.id])

  return (
    <SourcesSidebarContext.Provider
      value={{ activeSidebarMessageId, setActiveSidebarMessageId }}
    >
      {children}
    </SourcesSidebarContext.Provider>
  )
}

export interface Props {
  message: Message
  messageIndex: number
  onEdit?: (editedMessage: Message) => void
  onRegenerate?: (messageIndex: number) => void
  onFeedback?: (
    message: Message,
    isPositive: boolean | null,
    category?: string,
    details?: string,
  ) => void
  context?: ContextWithMetadata[]
  contentRenderer?: (message: Message) => JSX.Element
      onImageUrlsUpdate?: (message: Message, messageIndex: number) => void
  courseName: string
}

// Add this helper function before the ChatMessage component
function extractUsedCitationIndexes(content: string | Content[]): number[] {
  const text = Array.isArray(content)
    ? content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join(' ')
    : content

  // Look for tooltip titles with "Citation X" format
  const citationRegex = /"Citation (\d+)"/g
  const found: number[] = []

  // Extract citations
  let match
  while ((match = citationRegex.exec(text)) !== null) {
    const idx = parseInt(match[1] as string, 10)
    if (!Number.isNaN(idx)) {
      found.push(idx)
    }
  }

  // Fallback to the old pattern for backward compatibility
  // 1. Multiple citations format: "Citations X, Y, Z"
  const multipleCitationsRegex = /"Citations ([\d, ]+)"/g
  while ((match = multipleCitationsRegex.exec(text)) !== null) {
    const indices = (match[1] as string)
      .split(',')
      .map((idx) => parseInt(idx.trim(), 10))
      .filter((idx) => !Number.isNaN(idx))

    found.push(...indices)
  }

  // 2. Old pipe format: (Document | X)
  const oldCitationRegex = /\([^|]+\|\s*(\d+)\)/g
  while ((match = oldCitationRegex.exec(text)) !== null) {
    const idx = parseInt(match[1] as string, 10)
    if (!Number.isNaN(idx)) {
      found.push(idx)
    }
  }

  return Array.from(new Set(found)) // Remove duplicates while preserving order
}

// Add these helper functions before the ChatMessage component
function getFileType(s3Path?: string, url?: string) {
  if (s3Path) {
    const lowerPath = s3Path.toLowerCase()
    if (lowerPath.endsWith('.pdf')) return 'pdf'
    if (lowerPath.endsWith('.md')) return 'md'
    if (lowerPath.endsWith('.rtf')) return 'rtf'
  }
  if (url) return 'web'
  return 'other'
}

function isFilePreviewable(fileName: string, fileType?: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  // PDFs can be previewed
  if (fileType?.includes('pdf') || extension === 'pdf') {
    return true
  }
  
  // Text files can be previewed
  if (fileType?.includes('text') || extension === 'txt' || extension === 'md' || 
      extension === 'html' || extension === 'xml' || extension === 'csv' || 
      extension === 'py' || extension === 'srt' || extension === 'vtt') {
    return true
  }
  
  // Office documents and other files cannot be previewed
  return false
}

// Add this helper function at the top
function decodeHtmlEntities(str: string | undefined): string {
  if (!str) return ''
  const doc = new DOMParser().parseFromString(str, 'text/html')
  return doc.body.textContent || str
}

export const ChatMessage = memo(
  ({
    message,
    messageIndex,
    onEdit,
    onRegenerate,
    onFeedback,
    onImageUrlsUpdate,
    courseName,
  }: Props) => {
    const { t } = useTranslation('chat')
    const { activeSidebarMessageId, setActiveSidebarMessageId } =
      useReactContext(SourcesSidebarContext)

    const {
      state: {
        selectedConversation,
        messageIsStreaming,
        isImg2TextLoading,
        isRouting,
        isRunningTool,
        isRetrievalLoading,
        isQueryRewriting,
        loading,
      },
      dispatch: homeDispatch,
    } = useContext(HomeContext)

    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [messageContent, setMessageContent] = useState<string>('')
    const [localContent, setLocalContent] = useState<string | Content[]>(
      message.content,
    )
    const [imageUrls, setImageUrls] = useState<Set<string>>(new Set())

    const [isRightSideVisible, setIsRightSideVisible] = useState(false)
    const [sourceThumbnails, setSourceThumbnails] = useState<string[]>([])
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] =
      useState<boolean>(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // SET TIMER for message writing (from gpt-4)
    const [timerVisible, setTimerVisible] = useState(false)
    const { classes } = useStyles() // for Accordion

    // Remove the local state for sources sidebar and use only context
    const isSourcesSidebarOpen = activeSidebarMessageId === message.id

    useEffect(() => {
      // Close Sources sidebar if right sidebar is opened
      if (isRightSideVisible) {
        setActiveSidebarMessageId(null)
      }
    }, [isRightSideVisible, setActiveSidebarMessageId])

    // Function to handle opening/closing the Sources sidebar
    const handleSourcesSidebarToggle = (open: boolean) => {
      if (open) {
        // If opening this sidebar, set this message's ID as active
        setActiveSidebarMessageId(message.id)
      } else if (isSourcesSidebarOpen) {
        // Only close if this message's sidebar is currently open
        setActiveSidebarMessageId(null)
      }
      setIsRightSideVisible(false)
    }

    // Function to handle closing the Sources sidebar
    const handleSourcesSidebarClose = () => {
      if (isSourcesSidebarOpen) {
        setActiveSidebarMessageId(null)
      }
    }

    // Function to check if any Sources sidebar is open
    const isAnySidebarOpen = () => {
      return activeSidebarMessageId !== null
    }

    // Cleanup effect for modal
    useEffect(() => {
      return () => {
        setIsFeedbackModalOpen(false)
      }
    }, [message.id])

    useEffect(() => {
      if (message.role === 'assistant') {
        if (
          messageIsStreaming &&
          messageIndex == (selectedConversation?.messages.length ?? 0) - 1
        ) {
          setTimerVisible(true)
        } else {
          setTimerVisible(false)
        }
      }
    }, [message.role, messageIsStreaming, messageIndex, selectedConversation])

    function deepEqual(a: any, b: any) {
      if (a === b) {
        return true
      }

      if (
        typeof a !== 'object' ||
        a === null ||
        typeof b !== 'object' ||
        b === null
      ) {
        return false
      }

      const keysA = Object.keys(a),
        keysB = Object.keys(b)

      if (keysA.length !== keysB.length) {
        return false
      }

      for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
          return false
        }
      }

      return true
    }

    useEffect(() => {
      const fetchUrl = async () => {
        let isValid = false
        if (Array.isArray(message.content)) {
          const updatedContent = await Promise.all(
            message.content.map(async (content) => {
              if (content.type === 'image_url' && content.image_url) {
                isValid = await checkIfUrlIsValid(content.image_url.url)
                if (isValid) {
                  setImageUrls(
                    (prevUrls) =>
                      new Set([...prevUrls, content.image_url?.url as string]),
                  )
                  return content
                } else {
                  const path = extractPathFromUrl(content.image_url.url)
                  const presignedUrl = await getPresignedUrl(path, courseName)
                  setImageUrls(
                    (prevUrls) => new Set([...prevUrls, presignedUrl]),
                  )
                  return { ...content, image_url: { url: presignedUrl } }
                }
              }
              return content
            }),
          )
          if (
            !isValid &&
            // onImageUrlsUpdate && // Commented out image upload functionality
            !deepEqual(updatedContent, message.content)
          ) {
            // onImageUrlsUpdate( // Commented out image upload functionality
            //   { ...message, content: updatedContent }, // Commented out image upload functionality
            //   messageIndex, // Commented out image upload functionality
            // ) // Commented out image upload functionality
          }
        }
      }
      // Call fetchUrl for all messages that contain images
      if (Array.isArray(message.content) && message.content.some(content => content.type === 'image_url')) {
        fetchUrl()
      }
    }, [message.content, messageIndex, isRunningTool])

    const toggleEditing = () => {
      if (!isEditing) {
        // Set the initial content when starting to edit
        if (Array.isArray(message.content)) {
          const textContent = message.content
            .filter((content) => content.type === 'text')
            .map((content) => content.text)
            .join(' ')
          setMessageContent(textContent)
        } else {
          setMessageContent(message.content as string)
        }
      }
      setIsEditing(!isEditing)
      // Focus the textarea after the state update and component re-render
      setTimeout(() => {
        if (!isEditing && textareaRef.current) {
          textareaRef.current.focus()
          // Place cursor at the end of the text
          const length = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(length, length)
        }
      }, 0)
    }

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessageContent(event.target.value)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }

    const handleEditMessage = () => {
      const trimmedContent = messageContent.trim()
      if (trimmedContent.length === 0) return

      if (selectedConversation && onEdit) {
        let editedContent: string | Content[]
        
        if (Array.isArray(message.content)) {
          // Preserve file and image content, only update text content
          const nonTextContent = message.content.filter(content => content.type !== 'text')
          const newTextContent = trimmedContent ? [{ type: 'text' as MessageType, text: trimmedContent }] : []
          editedContent = [...newTextContent, ...nonTextContent]
        } else {
          // If it's a simple string message, just use the edited text
          editedContent = trimmedContent
        }

        const editedMessage = { ...message, content: editedContent }
        onEdit(editedMessage)

        // Save to server
        const updatedConversation = {
          ...selectedConversation,
          messages: selectedConversation.messages.map((msg) =>
            msg.id === message.id ? editedMessage : msg,
          ),
        }
        saveConversationToServer(updatedConversation, courseName).catch(
          (error: Error) => {
            console.error('Error saving edited message to server:', error)
          },
        )
      }
      setIsEditing(false)
    }

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault()
        const trimmedContent = messageContent.trim()
        if (trimmedContent.length > 0) {
          handleEditMessage()
        }
      }
    }

    useEffect(() => {
      // setMessageContent(message.content)
      if (Array.isArray(message.content)) {
        const textContent = message.content
          .filter((content) => content.type === 'text')
          .map((content) => content.text)
          .join(' ')
        setMessageContent(textContent)
      }
      // RIGHT HERE, run context search.
      // WARNING! Kastan trying to set message context.
      // console.log('IN handleSend: ', message)
      // if (message.role === 'user') {
      //   buildContexts(message.content)
      // }
    }, [message.content])

    useEffect(() => {
      // console.log('Resetting image urls because message: ', message, 'selectedConversation: ', selectedConversation)
      setImageUrls(new Set())
      // console.log('Set the image urls: ', imageUrls)
    }, [message])

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [isEditing])

    async function getPresignedUrl(
      uploadedImageUrl: string,
      courseName: string,
    ): Promise<string> {
      try {
        const presignedUrl = await fetchPresignedUrl(
          uploadedImageUrl,
          courseName,
        )
        return presignedUrl as string
      } catch (error) {
        console.error(
          'Failed to fetch presigned URL for',
          uploadedImageUrl,
          error,
        )
        return ''
      }
    }

    async function checkIfUrlIsValid(url: string): Promise<boolean> {
      try {
        const urlObject = new URL(url)

        // Check if the URL is an S3 presigned URL by looking for specific query parameters
        const isS3Presigned = urlObject.searchParams.has('X-Amz-Signature')

        if (isS3Presigned) {
          dayjs.extend(utc)
          let creationDateString = urlObject.searchParams.get(
            'X-Amz-Date',
          ) as string

          // Manually reformat the creationDateString to standard ISO 8601 format
          creationDateString = creationDateString.replace(
            /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
            '$1-$2-$3T$4:$5:$6Z',
          )

          // Adjust the format in the dayjs.utc function if necessary
          const creationDate = dayjs.utc(
            creationDateString,
            'YYYYMMDDTHHmmss[Z]',
          )

          const expiresInSecs = Number(
            urlObject.searchParams.get('X-Amz-Expires') as string,
          )
          const expiryDate = creationDate.add(expiresInSecs, 'second')
          const isExpired = expiryDate.toDate() < new Date()

          if (isExpired) {
            console.log('URL is expired') // Keep this log if necessary for debugging
            return false
          } else {
            return true
          }
        } else {
          // For non-S3 URLs, perform a simple fetch to check availability
          const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
          return response.type === 'opaque' // true if the fetch was successful, even though the response is opaque
        }
      } catch (error) {
        console.error('Failed to validate URL', url, error)
        return false
      }
    }

    function extractPathFromUrl(url: string): string {
      try {
        // Check if it's already a path (doesn't start with http/https)
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // It's already a path, just clean it up
          let path = url
          if (path.startsWith('/')) {
            path = path.substring(1)
          }
          return path
        }
        
        // It's a URL, try to parse it
        const urlObject = new URL(url)
        let path = urlObject.pathname
        if (path.startsWith('/')) {
          path = path.substring(1)
        }
        return path
      } catch (error) {
        console.error('Failed to extract path from URL:', url, error)
        // Fallback: try to extract path manually
        if (url.includes('/')) {
          const parts = url.split('/')
          return parts.slice(-1)[0] || url // Return the last part or the original URL
        }
        return url
      }
    }

    useEffect(() => {
      const processTools = async () => {
        if (message.tools && message.tools.length > 0) {
          for (const tool of message.tools) {
            if (tool.output && tool.output.s3Paths) {
              const imageUrls = await Promise.all(
                tool.output.s3Paths.map(async (s3Path) => {
                  return getPresignedUrl(s3Path, courseName)
                }),
              )
              tool.output.imageUrls = tool.output.imageUrls
                ? [...tool.output.imageUrls, ...imageUrls]
                : imageUrls
            }
            if (
              tool.aiGeneratedArgumentValues &&
              tool.aiGeneratedArgumentValues?.image_urls
            ) {
              const validUrls = await Promise.all(
                JSON.parse(tool.aiGeneratedArgumentValues.image_urls).map(
                  async (imageUrl: string) => {
                    const isValid = await checkIfUrlIsValid(imageUrl)
                    if (!isValid) {
                      // This will only work for internal S3 URLs
                      const s3_path = extractPathFromUrl(imageUrl)
                      return getPresignedUrl(s3_path, courseName)
                    }
                    return imageUrl
                  },
                ),
              )
              tool.aiGeneratedArgumentValues.image_urls =
                JSON.stringify(validUrls)
            }
            if (tool.output && tool.output.imageUrls) {
              const validUrls = await Promise.all(
                tool.output.imageUrls.map(async (imageUrl) => {
                  const isValid = await checkIfUrlIsValid(imageUrl)
                  if (!isValid) {
                    const s3_path = extractPathFromUrl(imageUrl)
                    return getPresignedUrl(s3_path, courseName)
                  }
                  return imageUrl
                }),
              )
              tool.output.imageUrls = validUrls
            }
          }
        }
      }

      processTools()
    }, [message.tools])

    // Add this useEffect for loading thumbnails
    useEffect(() => {
      let isMounted = true

      const loadThumbnails = async () => {
        // Early return if contexts is undefined, null, or not an array
        if (!Array.isArray(message.contexts) || message.contexts.length === 0)
          return

        // Track unique sources to avoid duplicates
        const seenSources = new Set<string>()
        const uniqueContexts = message.contexts.filter((context) => {
          const sourceKey = context.s3_path || context.url
          if (!sourceKey || seenSources.has(sourceKey)) return false
          seenSources.add(sourceKey)
          return true
        })

        const thumbnails = await Promise.all(
          uniqueContexts.slice(0, 5).map(async (context) => {
            // Changed from 3 to 5
            const fileType = getFileType(context.s3_path, context.url)

            if (fileType === 'pdf' && courseName) {
              const thumbnailPath = context.s3_path!.replace(
                '.pdf',
                '-pg1-thumb.png',
              )
              try {
                const presignedUrl = await fetchPresignedUrl(
                  thumbnailPath,
                  courseName,
                )
                return presignedUrl as string
              } catch (e) {
                console.error('Failed to fetch thumbnail:', e)
                return null
              }
            } else if (fileType === 'web' && context.url) {
              try {
                const urlObj = new URL(context.url)
                return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
              } catch (e) {
                console.error('Failed to get favicon:', e)
                return null
              }
            }
            return null
          }),
        )

        if (isMounted) {
          setSourceThumbnails(
            thumbnails.filter((url): url is string => url !== null),
          )
        }
      }

      loadThumbnails()

      return () => {
        isMounted = false
      }
    }, [message.contexts, courseName])

    // Add new function to replace expired links in text
    async function replaceExpiredLinksInText(
      text: string | undefined,
    ): Promise<string> {
      if (!text) return ''

      // Updated regex to match markdown links with citation tooltips
      // This matches [text](url "Citation N") format
      const linkRegex =
        /\[([^\]]+)\]\((https?:\/\/[^)]+?)(?:\s+"Citation\s+\d+")?\)/g
      let match
      let finalText = text

      while ((match = linkRegex.exec(text)) !== null) {
        try {
          const fullMatch = match[0]
          const citationText = match[1] || ''
          let linkUrl = match[2]

          // Decode HTML entities in the URL
          linkUrl = decodeHtmlEntities(linkUrl)

          if (!linkUrl) {
            continue
          }

          // Extract page number if present
          let pageNumber = ''
          let baseUrl = linkUrl

          // Handle #page=X format
          if (linkUrl.includes('#page=')) {
            const [urlPart, hashPart] = linkUrl.split('#')
            baseUrl = urlPart || ''
            pageNumber = '#' + hashPart
          }

          // Only process S3 URLs
          try {
            const url = new URL(baseUrl)
            if (
              !url.hostname.includes('s3') &&
              !url.hostname.includes('amazonaws')
            ) {
              continue
            }

            const refreshed = await refreshS3LinkIfExpired(baseUrl, courseName)

            // Only replace if the URL actually changed
            if (refreshed !== baseUrl) {
              // Reconstruct the link with the page number if it existed
              const newUrl = pageNumber
                ? `${refreshed}${pageNumber}`
                : refreshed

              // Extract tooltip if present
              const tooltipMatch = fullMatch.match(/\([^)]+\s+"([^"]+)"\)/)
              const tooltip = tooltipMatch ? ` "${tooltipMatch[1]}"` : ''

              // Use regex-safe replacement to avoid special characters issues
              const escapedFullMatch = fullMatch.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&',
              )
              finalText = finalText.replace(
                new RegExp(escapedFullMatch, 'g'),
                `[${citationText}](${newUrl}${tooltip})`,
              )
            }
          } catch (urlError) {
            console.error('Error parsing URL:', urlError, linkUrl)
            continue
          }
        } catch (error) {
          console.error('Error processing link:', error)
          continue
        }
      }

      return finalText
    }

    // Helper function to refresh S3 links if expired
    async function refreshS3LinkIfExpired(
      originalLink: string,
      courseName: string,
    ): Promise<string> {
      try {
        const urlObject = new URL(originalLink)

        // Is it actually an S3 presigned link?
        const isS3Presigned = urlObject.searchParams.has('X-Amz-Signature')
        if (!isS3Presigned) {
          return originalLink
        }

        // Use dayjs-based logic for reading X-Amz-Date and X-Amz-Expires
        dayjs.extend(utc)
        let creationDateString = urlObject.searchParams.get(
          'X-Amz-Date',
        ) as string

        // If missing or malformed, treat it as expired
        if (!creationDateString) {
          return await getNewPresignedUrl(originalLink, courseName)
        }

        // Convert 20250101T010101Z => 2025-01-01T01:01:01Z, etc.
        creationDateString = creationDateString.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
          '$1-$2-$3T$4:$5:$6Z',
        )

        const creationDate = dayjs.utc(
          creationDateString,
          'YYYY-MM-DDTHH:mm:ss[Z]',
        )
        const expiresInSecs = Number(
          urlObject.searchParams.get('X-Amz-Expires') || '0',
        )
        const expiryDate = creationDate.add(expiresInSecs, 'second')
        const now = dayjs()

        // If link is expired, fetch a new one
        if (expiryDate.isBefore(now)) {
          return await getNewPresignedUrl(originalLink, courseName)
        }

        return originalLink
      } catch (error) {
        console.error('Failed to refresh S3 link:', error)
        return originalLink
      }
    }

    async function getNewPresignedUrl(
      originalLink: string,
      courseName: string,
    ): Promise<string> {
      const s3path = extractPathFromUrl(originalLink)
      return (await fetchPresignedUrl(s3path, courseName)) as string
    }

    // Modify the useEffect for refreshing S3 links
    useEffect(() => {
      async function refreshS3LinksInContent() {
        const contentToProcess = message.content

        if (Array.isArray(contentToProcess)) {
          const updatedContent = await Promise.all(
            contentToProcess.map(async (contentObj) => {
              if (contentObj.type === 'text') {
                const newText = messageIsStreaming
                  ? contentObj.text
                  : await replaceExpiredLinksInText(contentObj.text)
                return { ...contentObj, text: newText }
              }
              return contentObj
            }),
          )
          setLocalContent(updatedContent)
        } else if (typeof contentToProcess === 'string') {
          const { thoughts, remainingContent } =
            extractThinkTagContent(contentToProcess)
          if (thoughts) {
            const processedThoughts = messageIsStreaming
              ? thoughts
              : await replaceExpiredLinksInText(thoughts)
            const processedContent = messageIsStreaming
              ? remainingContent
              : await replaceExpiredLinksInText(remainingContent)
            setLocalContent(
              `<think>${processedThoughts}</think>${processedContent}`,
            )
          } else {
            const newText = messageIsStreaming
              ? contentToProcess
              : await replaceExpiredLinksInText(contentToProcess)
            setLocalContent(newText)
          }
        }
      }
      refreshS3LinksInContent()
    }, [message.content, messageIsStreaming])

    // Modify the content rendering logic
    const renderContent = () => {
      let contentToRender = ''
      let thoughtsContent = null

      // Always use localContent for rendering
      if (typeof localContent === 'string') {
        const { thoughts, remainingContent } =
          extractThinkTagContent(localContent)
        thoughtsContent = thoughts
        contentToRender = remainingContent
      } else if (Array.isArray(localContent)) {
        contentToRender = localContent
          .filter((content) => content.type === 'text')
          .map((content) => content.text)
          .join(' ')
        const { thoughts, remainingContent } =
          extractThinkTagContent(contentToRender)
        thoughtsContent = thoughts
        contentToRender = remainingContent
      }

      return (
        <>
          {thoughtsContent && (
            <ThinkTagDropdown
              content={
                messageIsStreaming &&
                messageIndex ===
                  (selectedConversation?.messages.length ?? 0) - 1
                  ? `${thoughtsContent} ▍`
                  : thoughtsContent
              }
              isStreaming={
                messageIsStreaming &&
                messageIndex ===
                  (selectedConversation?.messages.length ?? 0) - 1 &&
                !contentToRender
              }
            />
          )}
          {contentToRender && (
            <MemoizedReactMarkdown
              className="linkMarkDown supMarkDown codeBlock prose mb-2 flex-1 flex-col items-start space-y-2 overflow-visible"
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeMathjax]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const text = String(children)

                  // Simple regex to see if there's a [title](url) pattern
                  const linkRegex = /\[[^\]]+\]\([^)]+\)/

                  // If it looks like a link, parse it again as normal Markdown
                  if (linkRegex.test(text)) {
                    return (
                      <MemoizedReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeMathjax]}
                      >
                        {text}
                      </MemoizedReactMarkdown>
                    )
                  }

                  // Handle cursor placeholder
                  if (children.length) {
                    if (children[0] == '▍') {
                      return (
                        <span className="mt-1 animate-pulse cursor-default">
                          ▍
                        </span>
                      )
                    }

                    children[0] = (children[0] as string).replace('`▍`', '▍')
                  }

                  const match = /language-(\w+)/.exec(className || '')

                  return !inline ? (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      style={{
                        maxWidth: '100%',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                      {...props}
                    />
                  ) : (
                    <code
                      className={'codeBlock'}
                      {...props}
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {children}
                    </code>
                  )
                },
              p({ node, children }) {
                return (
                  <p
                    className={`self-start text-base font-normal ${montserrat_paragraph.variable} pb-2 font-montserratParagraph`}
                  >
                    {children}
                  </p>
                )
              },
              ul({ children }) {
                return (
                  <ul
                    className={`text-base font-normal ${montserrat_paragraph.variable} font-montserratParagraph`}
                  >
                    {children}
                  </ul>
                )
              },
              ol({ children }) {
                return (
                  <ol
                    className={`text-base font-normal ${montserrat_paragraph.variable} ml-4 font-montserratParagraph lg:ml-6`}
                  >
                    {children}
                  </ol>
                )
              },
              li({ children }) {
                return (
                  <li
                    className={`text-base font-normal ${montserrat_paragraph.variable} break-words font-montserratParagraph`}
                  >
                    {children}
                  </li>
                )
              },
              table({ children }) {
                return (
                  <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                    {children}
                  </table>
                )
              },
              th({ children }) {
                return (
                  <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                    {children}
                  </th>
                )
              },
              td({ children }) {
                return (
                  <td className="break-words border border-black px-3 py-1 dark:border-white">
                    {children}
                  </td>
                )
              },
              h1({ node, children }) {
                return (
                  <h1
                    className={`text-4xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {children}
                  </h1>
                )
              },
              h2({ node, children }) {
                return (
                  <h2
                    className={`text-3xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {children}
                  </h2>
                )
              },
              h3({ node, children }) {
                return (
                  <h3
                    className={`text-2xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {children}
                  </h3>
                )
              },
              h4({ node, children }) {
                return (
                  <h4
                    className={`text-lg font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {children}
                  </h4>
                )
              },
              h5({ node, children }) {
                return (
                  <h5
                    className={`text-base font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {children}
                  </h5>
                )
              },
              h6({ node, children }) {
                return (
                  <h6
                    className={`text-base font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    {children}
                  </h6>
                )
              },
              a({ node, className, children, ...props }) {
                return <MarkdownLink {...props}>{children}</MarkdownLink>
              },
            }}
          >
            {contentToRender}
          </MemoizedReactMarkdown>
          )}
        </>
      )
    }

    // Add MarkdownLink component definition
    const MarkdownLink: React.FC<{
      href?: string
      title?: string
      children: React.ReactNode
    }> = ({ href, title, children }) => {
      const firstChild =
        children && Array.isArray(children) ? children[0] : null

      // Check if this is a citation link by looking for:
      // 1. Title attribute containing "Citation" or "Citations"
      // 2. Content that includes document titles from contexts
      // 3. The old format with pipe and citation number
      const isCitationByTitle =
        title &&
        (title.startsWith('Citation ') || title.startsWith('Citations '))
      const isCitationByContent =
        typeof firstChild === 'string' &&
        (Array.isArray(message.contexts)
          ? message.contexts.some(
              (ctx) =>
                ctx.readable_filename &&
                firstChild.includes(ctx.readable_filename),
            )
          : false)
      const isOldFormatCitation =
        typeof firstChild === 'string' && firstChild.includes(' | ')

      const isValidCitation =
        isCitationByTitle || isCitationByContent || isOldFormatCitation

      const handleClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
          if (href) {
            window.open(href, '_blank')?.focus()
          }
        },
        [href],
      )

      // Reference to the link element
      const linkRef = React.useRef<HTMLAnchorElement>(null)
      // State to track tooltip alignment
      const [tooltipAlignment, setTooltipAlignment] = React.useState<
        'center' | 'left' | 'right'
      >('center')
      // State to track if tooltip should be shown
      const [showTooltip, setShowTooltip] = useState(false)

      // Check if tooltip needs alignment adjustment when link is hovered
      const handleMouseEnter = useCallback(() => {
        if (!linkRef.current || !title) return

        // Set tooltip visibility
        setShowTooltip(true)

        const linkRect = linkRef.current.getBoundingClientRect()
        const tooltipWidth = 200 // Approximate width of tooltip

        // Check if tooltip would overflow left or right side of viewport
        if (linkRect.left < tooltipWidth / 2) {
          setTooltipAlignment('left')
        } else if (linkRect.right + tooltipWidth / 2 > window.innerWidth) {
          setTooltipAlignment('right')
        } else {
          setTooltipAlignment('center')
        }
      }, [title])

      // Handle mouse leave to hide tooltip
      const handleMouseLeave = useCallback(() => {
        setShowTooltip(false)
      }, [])

      // Check if this message is currently streaming
      const isCurrentlyStreaming =
        messageIsStreaming &&
        messageIndex === (selectedConversation?.messages.length ?? 0) - 1

      const commonProps = {
        id: 'styledLink',
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
        onMouseUp: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClick: (e: React.MouseEvent) => e.preventDefault(), // Prevent default click behavior
        style: { pointerEvents: 'all' as const },
        ref: linkRef,
      }

      if (isValidCitation) {
        // Determine tooltip class based on streaming state
        const tooltipClass = `citation-tooltip-container ${
          tooltipAlignment === 'left'
            ? 'left-align'
            : tooltipAlignment === 'right'
              ? 'right-align'
              : ''
        } ${isCurrentlyStreaming ? 'streaming-tooltip' : ''}`

        return (
          <span className="citation-wrapper" style={{ display: 'inline' }}>
            <a {...commonProps} className={'supMarkDown'}>
              {children}
              {title && (
                <span
                  className={tooltipClass}
                  style={{
                    // Force visibility based on hover state when streaming
                    visibility:
                      isCurrentlyStreaming && showTooltip
                        ? 'visible'
                        : undefined,
                    opacity:
                      isCurrentlyStreaming && showTooltip ? 1 : undefined,
                  }}
                >
                  <span className="citation-tooltip">{title}</span>
                </span>
              )}
            </a>
          </span>
        )
      } else {
        return (
          <a {...commonProps} className={'linkMarkDown'}>
            {children}
          </a>
        )
      }
    }

    // Fix the handleFeedbackSubmit function to match the expected signature
    const handleFeedbackSubmit = useCallback(
      (feedback: string, category: string) => {
        // Create a deep copy of just the message
        const messageCopy = JSON.parse(JSON.stringify(message))

        if (onFeedback) {
          onFeedback(messageCopy, false, category, feedback)
        }
        setIsFeedbackModalOpen(false)
      },
      [message, onFeedback],
    )

    // Helper function to safely get contexts length
    const getContextsLength = (contexts: any): number => {
      return Array.isArray(contexts) ? contexts.length : 0
    }

    const [filePreviewModal, setFilePreviewModal] = useState<{
      isOpen: boolean
      fileName: string
      fileUrl?: string
      fileType?: string
    }>({
      isOpen: false,
      fileName: '',
    })

    const handleFilePreview = (
      fileName: string,
      fileUrl?: string,
      fileType?: string,
    ) => {
      setFilePreviewModal({
        isOpen: true,
        fileName,
        fileUrl,
        fileType,
      })
    }

    const handleFileAction = async (
      fileName: string,
      fileUrl?: string,
      fileType?: string,
    ) => {
      if (isFilePreviewable(fileName, fileType)) {
        // For previewable files, open the modal
        handleFilePreview(fileName, fileUrl, fileType)
      } else {
        // For non-previewable files, trigger direct download
        if (fileUrl) {
          try {
            const presignedUrl = await fetchPresignedUrl(fileUrl, courseName, undefined, fileName)
            if (presignedUrl) {
              const link = document.createElement('a')
              link.href = presignedUrl
              link.download = fileName
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          } catch (error) {
            console.error('Failed to download file:', error)
          }
        }
      }
    }

    const closeFilePreview = () => {
      setFilePreviewModal({
        isOpen: false,
        fileName: '',
      })
    }

    return (
      <>
        <div
          className={`group md:px-6 ${
            message.role === 'assistant'
              ? 'bg-[--chat-background]'
              : 'bg-[--chat-background-user] pt-4'
          } max-w-[100%]`}
          style={{ overflowWrap: 'anywhere' }}
        >
          <div className="relative flex w-full overflow-visible px-2 py-2 pt-4 text-base md:mx-[5%] md:max-w-[90%] md:gap-6  lg:mx-[10%]">
            <div className="min-w-[40px] text-left">
              {message.role === 'assistant' ? (
                <>
                  <IconRobot size={30} />
                  <Timer timerVisible={timerVisible} />
                </>
              ) : (
                <IconUser size={30} color="var(--chat-user)" />
              )}
            </div>

            <div className="prose mt-[-2px] flex w-full max-w-full flex-wrap overflow-visible lg:w-[90%]">
              {message.role === 'user' ? (
                <div className="flex w-[90%] flex-col">
                  {isEditing ? (
                    <div className="flex w-full flex-col">
                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none whitespace-pre-wrap rounded-md border border-[--foreground-faded] bg-[--background-faded] p-3 focus:border-[--primary] focus:outline-none"
                        value={messageContent}
                        onChange={handleInputChange}
                        onKeyDown={handlePressEnter}
                        onCompositionStart={() => setIsTyping(true)}
                        onCompositionEnd={() => setIsTyping(false)}
                        style={{
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          lineHeight: 'inherit',
                          minHeight: '100px',
                        }}
                      />
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          className="flex items-center gap-2 rounded-md border border-[--button] bg-transparent px-4 py-2 text-sm font-medium text-[--foreground] opacity-50 transition-colors hover:opacity-100"
                          onClick={() => {
                            setMessageContent(messageContent)
                            setIsEditing(false)
                          }}
                        >
                          <IconX size={16} />
                          {t('Cancel')}
                        </button>
                        <button
                          className="flex items-center gap-2 rounded-md bg-[--button] px-4 py-2 text-sm font-medium text-[--button-text-color] transition-colors hover:bg-[--button-hover] hover:text-[--button-hover-text-color] disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={handleEditMessage}
                          disabled={messageContent.trim().length <= 0}
                        >
                          <IconCheck size={16} />
                          {t('Save & Submit')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="prose w-full flex-1 overflow-visible whitespace-pre-wrap">
                        {Array.isArray(message.content) ? (
                          <>
                            <div className="mb-0 flex w-full flex-col items-start space-y-2">
                              {/* User message text for all messages */}
                              {message.content.map((content, index) => {
                                if (content.type === 'text') {
                                  // Regular text content
                                  if (
                                    !(content.text as string)
                                      .trim()
                                      .startsWith('Image description:')
                                  ) {
                                    return (
                                      <p
                                        key={index}
                                        className={`self-start text-lg font-black text-[--chat-user] ${montserrat_heading.variable} font-montserratHeading`}
                                      >
                                        {content.text}
                                      </p>
                                    )
                                  }
                                }
                              })}
                              {/* File cards for all messages */}
                              <div className="-m-1 flex w-full flex-wrap justify-start">
                                {message.content
                                  .filter((item) => item.type === 'file')
                                  .map((content, index) => {
                                    const fileName = content.fileName || 'Unknown file'
                                    const isPreviewable = isFilePreviewable(fileName, content.fileType)
                                    return (
                                      <div key={index} className="mb-2">
                                        <FileCard
                                          fileName={fileName}
                                          fileType={content.fileType}
                                          fileUrl={content.fileUrl}
                                          isPreviewable={isPreviewable}
                                          onClick={() =>
                                            handleFileAction(
                                              fileName,
                                              content.fileUrl,
                                              content.fileType,
                                            )
                                          }
                                        />
                                      </div>
                                    )
                                  })}
                              </div>

                              {/* Image previews for all messages */}
                              <div className="-m-1 flex w-full flex-wrap justify-start">
                                {message.content
                                  .filter((item) => item.type === 'image_url')
                                  .map((content, index) => {
                                    // Try to get the processed URL from imageUrls state first
                                    const imageUrlsArray = Array.from(imageUrls)
                                    const processedUrl = imageUrlsArray[index] || content.image_url?.url
                                    

                                    
                                    return (
                                      <div
                                        key={index}
                                        className={classes.imageContainerStyle}
                                      >
                                        <div className="overflow-hidden rounded-lg">
                                          <ImagePreview
                                            src={processedUrl as string}
                                            alt="Chat message"
                                            className={classes.imageStyle}
                                          />
                                        </div>
                                      </div>
                                    )
                                  })}
                              </div>

                              {/* Image description loading state for last message */}
                              {isImg2TextLoading &&
                                (messageIndex ===
                                  (selectedConversation?.messages.length ?? 0) -
                                    1 ||
                                  messageIndex ===
                                    (selectedConversation?.messages.length ??
                                      0) -
                                      2) && (
                                  <IntermediateStateAccordion
                                    accordionKey="imageDescription"
                                    title="Image Description"
                                    isLoading={isImg2TextLoading}
                                    error={false}
                                    content={
                                      message.content.find(
                                        (content) =>
                                          content.type === 'text' &&
                                          content.text
                                            ?.trim()
                                            .startsWith('Image description:'),
                                      )?.text ?? 'No image description found'
                                    }
                                  />
                                )}

                              {/* Image description for all messages */}
                              {message.content.some(
                                (content) =>
                                  content.type === 'text' &&
                                  content.text
                                    ?.trim()
                                    .startsWith('Image description:'),
                              ) && (
                                <IntermediateStateAccordion
                                  accordionKey="imageDescription"
                                  title="Image Description"
                                  isLoading={false}
                                  error={false}
                                  content={
                                    message.content.find(
                                      (content) =>
                                        content.type === 'text' &&
                                        content.text
                                          ?.trim()
                                          .startsWith('Image description:'),
                                    )?.text ?? 'No image description found'
                                  }
                                />
                              )}
                            </div>
                          </>
                        ) : (
                          <>{message.content}</>
                        )}
                        <div className="mt-2 flex w-full flex-col items-start space-y-2">
                          {/* Query rewrite loading state - only show for current message */}
                          {isQueryRewriting &&
                            messageIndex ===
                              (selectedConversation?.messages?.length ?? 0) -
                                1 && (
                              <IntermediateStateAccordion
                                accordionKey="query-rewrite"
                                title="Optimizing search query"
                                isLoading={isQueryRewriting}
                                error={false}
                                content={<></>}
                              />
                            )}

                          {/* Query rewrite result - show for any message that was optimized */}
                          {(!isQueryRewriting ||
                            messageIndex <
                              (selectedConversation?.messages?.length ?? 0) -
                                1) &&
                            message.wasQueryRewritten !== undefined &&
                            message.wasQueryRewritten !== null && (
                              <IntermediateStateAccordion
                                accordionKey="query-rewrite-result"
                                title={
                                  message.wasQueryRewritten
                                    ? 'Optimized search query'
                                    : 'No query optimization necessary'
                                }
                                isLoading={false}
                                error={false}
                                content={
                                  message.wasQueryRewritten
                                    ? message.queryRewriteText
                                    : "The LLM determined no optimization was necessary. We only optimize when it's necessary to turn a single message into a stand-alone search to retrieve the best documents."
                                }
                              />
                            )}

                          {/* Retrieval results for all messages */}
                          {Array.isArray(message.contexts) &&
                            message.contexts.length > 0 && (
                              <IntermediateStateAccordion
                                accordionKey="retrieval loading"
                                title="Retrieved documents"
                                isLoading={false}
                                error={false}
                                content={`Found ${getContextsLength(message.contexts)} document chunks.`}
                              />
                            )}

                          {/* Retrieval loading state for last message */}
                          {isRetrievalLoading &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                                1 ||
                              messageIndex ===
                                (selectedConversation?.messages.length ?? 0) -
                                  2) && (
                              <IntermediateStateAccordion
                                accordionKey="retrieval loading"
                                title="Retrieving documents"
                                isLoading={isRetrievalLoading}
                                error={false}
                                content={`Found ${getContextsLength(message.contexts)} document chunks.`}
                              />
                            )}

                          {/* Tool Routing loading state for last message */}
                          {isRouting &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                                1 ||
                              messageIndex ===
                                (selectedConversation?.messages.length ?? 0) -
                                  2) && (
                              <IntermediateStateAccordion
                                accordionKey={`routing tools`}
                                title={'Routing the request to relevant tools'}
                                isLoading={isRouting}
                                error={false}
                                content={<></>}
                              />
                            )}

                          {/* Tool input arguments state for last message */}
                          {isRouting === false &&
                            message.tools &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                                1 ||
                              messageIndex ===
                                (selectedConversation?.messages.length ?? 0) -
                                  2) && (
                              <>
                                {message.tools.map((response, index) => (
                                  <IntermediateStateAccordion
                                    key={`routing-${index}`}
                                    accordionKey={`routing-${index}`}
                                    title={
                                      <>
                                        Routing the request to{' '}
                                        <Badge
                                          color="var(--background-dark)"
                                          radius="md"
                                          size="sm"
                                          styles={{
                                            root: {
                                              color: 'var(--foreground)',
                                              backgroundColor:
                                                'var(--background-dark)',
                                            },
                                          }}
                                        >
                                          {response.readableName}
                                        </Badge>
                                      </>
                                    }
                                    isLoading={isRouting}
                                    error={false}
                                    content={
                                      <>
                                        Arguments :{' '}
                                        {response.aiGeneratedArgumentValues
                                          ?.image_urls ? (
                                          <div>
                                            <div className="flex overflow-x-auto">
                                              {JSON.parse(
                                                response
                                                  .aiGeneratedArgumentValues
                                                  .image_urls,
                                              ).length > 0 ? (
                                                JSON.parse(
                                                  response
                                                    .aiGeneratedArgumentValues
                                                    .image_urls,
                                                ).map(
                                                  (
                                                    imageUrl: string,
                                                    index: number,
                                                  ) => (
                                                    <div
                                                      key={index}
                                                      className={
                                                        classes.imageContainerStyle
                                                      }
                                                    >
                                                      <div className="overflow-hidden rounded-lg">
                                                        <ImagePreview
                                                          src={imageUrl}
                                                          alt={`Tool image argument ${index}`}
                                                          className={
                                                            classes.imageStyle
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  ),
                                                )
                                              ) : (
                                                <p>No arguments provided</p>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <pre>
                                            {JSON.stringify(
                                              response.aiGeneratedArgumentValues,
                                              null,
                                              2,
                                            )}
                                          </pre>
                                        )}
                                      </>
                                    }
                                  />
                                ))}
                              </>
                            )}

                          {/* Tool output states for last message */}
                          {(messageIndex ===
                            (selectedConversation?.messages.length ?? 0) - 1 ||
                            messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                                2) && (
                            <>
                              {message.tools?.map((response, index) => (
                                <IntermediateStateAccordion
                                  key={`tool-${index}`}
                                  accordionKey={`tool-${index}`}
                                  title={
                                    <>
                                      Tool output from{' '}
                                      <Badge
                                        color="var(--background-dark)"
                                        radius="md"
                                        size="sm"
                                        styles={{
                                          root: {
                                            color: response.error
                                              ? 'var(--illinois-white)'
                                              : 'var(--foreground)',
                                            backgroundColor: response.error
                                              ? 'var(--badge-error)'
                                              : 'var(--background-dark)',
                                          },
                                        }}
                                      >
                                        {response.readableName}
                                      </Badge>
                                    </>
                                  }
                                  isLoading={
                                    response.output === undefined &&
                                    response.error === undefined
                                  }
                                  error={response.error ? true : false}
                                  content={
                                    <>
                                      {response.error ? (
                                        <span>{response.error}</span>
                                      ) : (
                                        <>
                                          <div
                                            style={{
                                              display: 'flex',
                                              overflowX: 'auto',
                                              gap: '10px',
                                            }}
                                          >
                                            {response.output?.imageUrls &&
                                              response.output?.imageUrls.map(
                                                (imageUrl, index) => (
                                                  <div
                                                    key={index}
                                                    className={
                                                      classes.imageContainerStyle
                                                    }
                                                  >
                                                    <div className="overflow-hidden rounded-lg">
                                                      <ImagePreview
                                                        src={imageUrl}
                                                        alt={`Tool output image ${index}`}
                                                        className={
                                                          classes.imageStyle
                                                        }
                                                      />
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                          </div>
                                          <div>
                                            {response.output?.text
                                              ? response.output.text
                                              : JSON.stringify(
                                                  response.output?.data,
                                                  null,
                                                  2,
                                                )}
                                          </div>
                                        </>
                                      )}
                                    </>
                                  }
                                />
                              ))}
                            </>
                          )}
                          {(() => {
                            if (
                              messageIsStreaming === undefined ||
                              !messageIsStreaming
                            ) {
                              // console.log(
                              //   'isRouting: ',
                              //   isRouting,
                              //   'isRetrievalLoading: ',
                              //   isRetrievalLoading,
                              //   'isImg2TextLoading: ',
                              //   isImg2TextLoading,
                              //   'messageIsStreaming: ',
                              //   messageIsStreaming,
                              //   'loading: ',
                              //   loading,
                              // )
                            }
                            return null
                          })()}
                          {!isRouting &&
                            !isRetrievalLoading &&
                            !isImg2TextLoading &&
                            !isQueryRewriting &&
                            loading &&
                            (messageIndex ===
                              (selectedConversation?.messages.length ?? 0) -
                                1 ||
                              messageIndex ===
                                (selectedConversation?.messages.length ?? 0) -
                                  2) &&
                            (!message.tools ||
                              message.tools.every(
                                (tool) =>
                                  tool.output !== undefined ||
                                  tool.error !== undefined,
                              )) && (
                              <>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginLeft: '10px',
                                    marginTop: '10px',
                                  }}
                                >
                                  <p
                                    style={{
                                      marginRight: '10px',
                                      fontWeight: 'bold',
                                      textShadow: '0 0 15px',
                                    }}
                                    className={`pulsate text-base ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  >
                                    Generating final response:
                                  </p>
                                  <LoadingSpinner size="xs" />
                                </div>
                              </>
                            )}
                        </div>
                      </div>
                      {!isEditing && (
                        <div className="mt-0 flex items-center justify-start gap-4">
                          <Tooltip
                            label="Edit Message"
                            position="bottom"
                            withArrow
                            arrowSize={6}
                            transitionProps={{
                              transition: 'fade',
                              duration: 200,
                            }}
                            classNames={{
                              tooltip: 'text-sm py-1 px-2',
                              arrow: 'border-gray-700',
                            }}
                            style={{
                              color: 'var(--tooltip)',
                              backgroundColor: 'var(--tooltip-background)',
                            }}
                          >
                            <button
                              className={`invisible text-[--foreground-faded] hover:text-[--foreground] focus:visible group-hover:visible
                                ${Array.isArray(message.content) && message.content.some((content) => content.type === 'image_url') ? 'hidden' : ''}`}
                              onClick={toggleEditing}
                            >
                              <IconEdit
                                size={20}
                                className="text-[--button-faded] hover:text-[--button]"
                              />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex w-[90%] flex-col">
                  <div className="w-full max-w-full flex-1 overflow-visible">
                    {renderContent()}
                  </div>
                  {/* Action Buttons Container */}
                  <div className="flex flex-col gap-2">
                    {/* Sources button */}
                    {Array.isArray(message.contexts) &&
                      message.contexts.length > 0 &&
                      !(
                        messageIsStreaming &&
                        messageIndex ===
                          (selectedConversation?.messages.length ?? 0) - 1
                      ) &&
                      !(
                        loading &&
                        messageIndex ===
                          (selectedConversation?.messages.length ?? 0) - 1
                      ) && (
                        <div className="relative z-0 mb-1 flex justify-start">
                          <button
                            className="group/button relative flex items-center gap-0 rounded-xl bg-[--dashboard-button] px-3 py-1.5 text-sm font-medium text-[--dashboard-button-foreground] transition-all duration-200 hover:bg-[--dashboard-button-hover]"
                            onClick={() => handleSourcesSidebarToggle(true)}
                          >
                            <span
                              className={`whitespace-nowrap ${montserrat_paragraph.variable} font-montserratParagraph font-bold`}
                            >
                              Sources
                              <span className="ml-0.5 rounded-full bg-[--background] px-1.5 py-0.5 text-xs text-[--foreground]">
                                {getContextsLength(message.contexts)}
                              </span>
                            </span>

                            {sourceThumbnails.length > 0 && (
                              <div className="flex items-center">
                                <div className="ml-1 mr-1 h-4 border-l border-gray-300"></div>
                                <div className="relative flex">
                                  {sourceThumbnails.map((thumbnail, index) => (
                                    <div
                                      key={index}
                                      className="relative h-7 w-7 overflow-hidden rounded-md border-2 border-gray-200 bg-[--dashboard-button-foreground] transition-transform duration-200"
                                      style={{
                                        marginLeft:
                                          index > 0 ? '-0.75rem' : '0',
                                        zIndex: index,
                                        transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`,
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-100 transition-opacity duration-200"></div>
                                      <img
                                        src={thumbnail}
                                        alt={`Source ${index + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </button>
                        </div>
                      )}

                    {/* Other buttons in their container */}
                    {!(
                      messageIsStreaming &&
                      messageIndex ===
                        (selectedConversation?.messages.length ?? 0) - 1
                    ) &&
                      !(
                        loading &&
                        messageIndex ===
                          (selectedConversation?.messages.length ?? 0) - 1
                      ) && (
                        <MessageActions
                          message={message}
                          messageIndex={messageIndex}
                          isLastMessage={
                            messageIndex ===
                            (selectedConversation?.messages.length ?? 0) - 1
                          }
                          onRegenerate={onRegenerate}
                          onFeedback={onFeedback}
                          onOpenFeedbackModal={() =>
                            setIsFeedbackModalOpen(true)
                          }
                        />
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* for testing citation styling, can remove later
<div class="supMarkDown p-8">For grapevines, consider using imidacloprid (Merit) or other appropriate insecticides, but be cautious or their impact on pollinators <a href="#">KY_Apple_CropProfile.pdf</a>; <a href="#">mw-grape-productn-b919-1.pdf, p.108</a>; <a href="#">mw-grape-productn-b919.pdf, p.108</a>;</div>
*/}
        </div>

        {/* Move SourcesSidebar outside the message div but keep it in the fragment */}
        {isSourcesSidebarOpen && (
          <SourcesSidebar
            isOpen={isSourcesSidebarOpen}
            contexts={Array.isArray(message.contexts) ? message.contexts : []}
            onClose={handleSourcesSidebarClose}
            hideRightSidebarIcon={isAnySidebarOpen}
            courseName={courseName}
            citedSourceIndices={
              message.role === 'assistant' && message.content
                ? extractUsedCitationIndexes(message.content)
                : undefined
            }
          />
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSubmit={handleFeedbackSubmit}
          />
        )}

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={filePreviewModal.isOpen}
          onClose={closeFilePreview}
          fileName={filePreviewModal.fileName}
          fileUrl={filePreviewModal.fileUrl}
          fileType={filePreviewModal.fileType}
          courseName={courseName}
        />
      </>
    )
  },
)
ChatMessage.displayName = 'ChatMessage'
