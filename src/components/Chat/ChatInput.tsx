// chatinput.tsx
import {
  type Content,
  type Message,
  type MessageType,
  type Conversation,
} from '@/types/chat'
import { type Plugin } from '@/types/plugin'
import { type Prompt } from '@/types/prompt'
import { Text } from '@mantine/core'
import {
  IconArrowDown,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconX,
  IconFileTypeTxt,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFile,
  IconPaperclip,
} from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import {
  type KeyboardEvent,
  type MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'

import HomeContext from '~/pages/api/home/home.context'

import { PluginSelect } from './PluginSelect'
import { PromptList } from './PromptList'
import { VariableModal } from './VariableModal'

import { Tooltip, useMantineTheme } from '@mantine/core'
import {
  showToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '~/utils/toastUtils'
import { Montserrat } from 'next/font/google'

import React from 'react'

import { type CSSProperties } from 'react'

import { useMediaQuery } from '@mantine/hooks'
import { IconChevronRight } from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import { fetchPresignedUrl, uploadToS3 } from 'src/utils/apiUtils'
import { UserSettings } from '~/components/Chat/UserSettings'
import {
  selectBestModel,
  VisionCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import { type OpenAIModelID } from '~/utils/modelProviders/types/openai'
import type ChatUI from '~/utils/modelProviders/WebLLM'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { ContextWithMetadata } from '~/types/chat'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

// Helper function to create a unique key for file comparison
const createFileKey = (file: File): string => {
  return `${file.name}-${file.type}`
}

// Helper function to remove duplicates from an array of files
const removeDuplicateFiles = (files: File[]): File[] => {
  const fileKeys = new Set<string>()
  return files.filter((file) => {
    const fileKey = createFileKey(file)
    if (fileKeys.has(fileKey)) {
      return false
    }
    fileKeys.add(fileKey)
    return true
  })
}

// constant created to check the types of files allowed to be uploaded
const ALLOWED_FILE_EXTENSIONS = [
  'html',
  'py',
  'pdf',
  'txt',
  'md',
  'srt',
  'vtt',
  'docx',
  'ppt',
  'pptx',
  'xlsx',
  'xls',
  'xlsm',
  'xlsb',
  'xltx',
  'xltm',
  'xlt',
  'xml',
  'xlam',
  'xla',
  'xlw',
  'xlr',
  'csv',
  'png',
  'jpg',
  'jpeg',
]

type FileUploadStatus = {
  file: File
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error'
  url?: string
  contexts?: ContextWithMetadata[]
}

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void
  onScrollDownClick: () => void
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  showScrollDownButton: boolean
  inputContent: string
  setInputContent: (content: string) => void
  user_id: string
  courseName: string
  chat_ui?: ChatUI
  onRegenerate?: () => void
}

async function createNewConversation(
  courseName: string,
  homeDispatch: any,
): Promise<Conversation> {
  const conversationId = uuidv4()
  const newConversation: Conversation = {
    id: conversationId,
    name: `File Upload - ${new Date().toLocaleString()}`,
    messages: [],
    model: {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      tokenLimit: 128000,
      enabled: true,
    },
    prompt:
      'You are a helpful assistant. You can analyze uploaded files and answer questions.',
    temperature: 0.5,
    folderId: null,
    createdAt: new Date().toISOString(),
  }

  homeDispatch({ field: 'selectedConversation', value: newConversation })
  homeDispatch({
    field: 'conversations',
    value: (prev: Conversation[]) => [newConversation, ...prev],
  })

  return newConversation
}

async function fetchFileUploadContexts(
  conversationId: string,
  courseName: string,
  user_id: string,
  fileName: string,
): Promise<ContextWithMetadata[]> {
  try {
    // Keep the original simple flow - single approach
    const requestBody = {
      course_name: courseName,
      user_id: user_id,
      search_query: fileName, // Use filename as search query
      token_limit: 4000,
      doc_groups: ['All Documents'],
      conversation_id: conversationId,
    }

    const response = await fetch('/api/getContexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (response.ok) {
      const data = await response.json()

      if (Array.isArray(data)) {
        // Filter by filename to ensure we get contexts for this specific file
        const filteredContexts = data.filter(
          (context: any) => context.readable_filename === fileName,
        )

        return filteredContexts
      } else {
        return []
      }
    } else {
      return []
    }
  } catch (error) {
    console.error('Error fetching file contexts:', error)
    return []
  }
}

export const ChatInput = ({
  onSend,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  inputContent,
  setInputContent,
  user_id,
  courseName,
  chat_ui,
  onRegenerate,
}: Props) => {
  const { t } = useTranslation('chat')

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts,
      showModelSettings,
      llmProviders,
    },

    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const [content, setContent] = useState<string>(() => inputContent)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [showPromptList, setShowPromptList] = useState(false)
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [promptInputValue, setPromptInputValue] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showPluginSelect, setShowPluginSelect] = useState(false)
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const promptListRef = useRef<HTMLUListElement | null>(null)
  const chatInputContainerRef = useRef<HTMLDivElement>(null)
  const chatInputParentContainerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const modelSelectContainerRef = useRef<HTMLDivElement | null>(null)
  const fileUploadRef = useRef<HTMLInputElement | null>(null)
  const [fileUploads, setFileUploads] = useState<FileUploadStatus[]>([])

  const handleFocus = () => {
    setIsFocused(true)
    if (chatInputParentContainerRef.current) {
      chatInputParentContainerRef.current.style.boxShadow = `0 0 2px rgba(42,42,120, 1)`
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (chatInputParentContainerRef.current) {
      chatInputParentContainerRef.current.style.boxShadow = 'none'
    }
  }

  const handleTextClick = () => {
    homeDispatch({
      field: 'showModelSettings',
      value: !showModelSettings,
    })
  }

  const removeButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--message-background)',
    color: 'rgba(from var(--message) r g b / .35)',
    cursor: 'pointer',
    zIndex: 2,
  }

  const removeButtonHoverStyle: CSSProperties = {
    color: 'var(--message)',
    backgroundColor: 'var(--message-background)',
    borderColor: 'var(--foreground)',
  }

  const chatInputContainerStyle: CSSProperties = {
    paddingBottom: '0',
    paddingLeft: '10px',
  }

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // TODO: Update this to use tokens, instead of characters
    const value = e.target.value
    const maxLength = selectedConversation?.model?.tokenLimit

    if (maxLength && value.length > maxLength) {
      alert(
        `This LLM can only handle ${maxLength} characters, but you entered ${value.length} characters. Please switch to a model with a bigger input limit (like Gemini, Claude or GPT) or shorten your message.`,
      )
      return
    }

    setContent(value)
    updatePromptListVisibility(value)
  }

  type Role = 'user' | 'system'

  const handleSend = async () => {
    const hasProcessingFiles = fileUploads.some(
      (fu) =>
        fu.status === 'processing' ||
        fu.status === 'uploading' ||
        fu.status === 'uploaded',
    )

    if (messageIsStreaming || hasProcessingFiles) {
      if (hasProcessingFiles) {
        showWarningToast(
          'Please wait for all files to finish processing',
          'Files Processing',
        )
      }
      return
    }

    const textContent = content
    let fileContent: Content[] = []

    // Handle file uploads: Only proceed if all files are completed
    const allFileContexts: ContextWithMetadata[] = []

    if (fileUploads.length > 0) {
      const pendingFiles = fileUploads.filter((fu) => fu.status !== 'completed')

      if (pendingFiles.length > 0) {
        showWarningToast(
          'Please wait for all files to finish processing before sending',
          'Files Still Processing',
        )
        return
      }

      // Create file content for the message (files are already processed)
      fileContent = fileUploads
        .filter((fu) => fu.status === 'completed')
        .map((fu) => {
          const isImageFile =
            fu.file.type.startsWith('image/') ||
            ['png', 'jpg', 'jpeg'].includes(
              fu.file.name.split('.').pop()?.toLowerCase() || '',
            )

          if (isImageFile) {
            // For image files, create image_url content
            return {
              type: 'image_url' as MessageType,
              image_url: {
                url: fu.url || '',
              },
            }
          } else {
            // For non-image files, create file content and add contexts
            if (fu.contexts && Array.isArray(fu.contexts)) {
              allFileContexts.push(...fu.contexts)
            }
            return {
              type: 'file' as MessageType,
              fileName: fu.file.name,
              fileUrl: fu.url,
              fileType: fu.file.type,
              fileSize: fu.file.size,
            }
          }
        })

      // Don't clear fileUploads yet - we need them for the file names in the text
      // setFileUploads([]) // Clear after using
    }

    if (!textContent && fileContent.length === 0) {
      alert(t('Please enter a message or upload a file'))
      return
    }

    // Use the original text content without adding file indicators
    const finalTextContent = textContent

    // Construct the content array
    const contentArray: Content[] = [
      ...(finalTextContent
        ? [{ type: 'text' as MessageType, text: finalTextContent }]
        : []),
      ...fileContent,
    ]

    // Create a structured message
    const messageForChat: Message = {
      id: uuidv4(),
      role: 'user',
      content: contentArray,
      contexts: allFileContexts.length > 0 ? allFileContexts : undefined,
    }

    // Use the onSend prop to send the structured message
    onSend(messageForChat, plugin)

    // Reset states
    setContent('')
    setPlugin(null)
    setFileUploads([]) // Clear file uploads after sending message

    if (fileUploadRef.current) {
      fileUploadRef.current.value = ''
    }
  }

  const handleStopConversation = () => {
    stopConversationRef.current = true
    setTimeout(() => {
      stopConversationRef.current = false
    }, 1000)
  }

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
    return mobileRegex.test(userAgent)
  }

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex]
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        )
        return newContent
      })
      handlePromptSelect(selectedPrompt)
    }
    setShowPromptList(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        )
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleInitModal()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowPromptList(false)
      } else {
        setActivePromptIndex(0)
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault()
      setShowPluginSelect(!showPluginSelect)
    }
  }

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g
    const foundVariables = []
    let match

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1])
    }

    return foundVariables
  }

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/)

    if (match) {
      setShowPromptList(true)
      setPromptInputValue(match[0].slice(1))
    } else {
      setShowPromptList(false)
      setPromptInputValue('')
    }
  }, [])

  const handlePromptSelect = useCallback(
    (prompt: Prompt) => {
      const parsedVariables = parseVariables(prompt.content)
      const filteredVariables = parsedVariables.filter(
        (variable) => variable !== undefined,
      ) as string[]
      setVariables(filteredVariables)

      if (filteredVariables.length > 0) {
        setIsModalVisible(true)
      } else {
        setContent((prevContent) => {
          const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content)
          return updatedContent
        })
        updatePromptListVisibility(prompt.content)
      }
    },
    [parseVariables, setContent, updatePromptListVisibility],
  )

  const handleSubmit = async () => {
    if (messageIsStreaming) {
      return
    }

    try {
      const response = await fetch('/api/allNewRoutingChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: selectedConversation,
          course_name: courseName,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        const errorMessage =
          errorResponse.error ||
          'An error occurred while processing your request'
        showErrorToast(errorMessage)
        return
      }
    } catch (error) {
      console.error('Error in chat submission:', error)
      showErrorToast(
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.',
      )
    }
  }

  async function handleFileSelection(newFiles: File[]) {
    const allFiles = [...fileUploads.map((f) => f.file), ...newFiles]

    // 1. Validation: number of files
    if (allFiles.length > 5) {
      showToast({
        title: 'Too Many Files',
        message:
          'You can upload a maximum of 5 files at once. Please remove some files before adding new ones.',
        type: 'error',
        autoClose: 6000,
      })
      return
    }

    // 2. Validation: total size
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
    const limit = 15 * 1024 * 1024
    if (totalSize > limit) {
      showToast({
        title: 'Files Too Large',
        message: `The total size of all files cannot exceed ${limit / 1024 / 1024}MB. Please remove large files or upload smaller ones.`,
        type: 'error',
        autoClose: 6000,
      })
      return
    }

    // 3. Validation: file types
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        showToast({
          title: 'Unsupported File Type',
          message: `The file "${file.name}" is not supported. Please upload files of the following types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}.`,
          type: 'error',
          autoClose: 6000,
        })
        return
      }
    }

    // Prevent duplicates by name and type
    const existingFiles = new Set(
      fileUploads.map((fu) => createFileKey(fu.file)),
    )
    const uniqueNewFiles = newFiles.filter(
      (file) => !existingFiles.has(createFileKey(file)),
    )

    if (uniqueNewFiles.length === 0) {
      showWarningToast(
        'All selected files are already uploaded or in progress.',
        'Duplicate Files',
      )
      return
    }

    // Check for duplicates within the new files themselves
    const finalUniqueFiles = removeDuplicateFiles(uniqueNewFiles)

    if (finalUniqueFiles.length === 0) {
      showWarningToast('All selected files are duplicates.', 'Duplicate Files')
      return
    }

    if (finalUniqueFiles.length < uniqueNewFiles.length) {
      const duplicateCount = uniqueNewFiles.length - finalUniqueFiles.length
      showInfoToast(
        `${duplicateCount} duplicate file(s) were removed from the selection.`,
        'Duplicate Files Removed',
      )
    }

    for (const file of finalUniqueFiles) {
      // Check if file is an image
      const isImageFile =
        file.type.startsWith('image/') ||
        ['png', 'jpg', 'jpeg'].includes(
          file.name.split('.').pop()?.toLowerCase() || '',
        )

      // Add to fileUploads
      setFileUploads((prev) => [
        ...prev,
        {
          file,
          status: 'uploading' as const,
        },
      ])

      // Upload all files to S3 and update status
      try {
        const s3Key = await uploadToS3(file, user_id, courseName, 'chat')

        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name
              ? { ...f, status: 'uploaded', url: s3Key }
              : f,
          ),
        )

        // **NEW: Immediately process the file after S3 upload**
        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name ? { ...f, status: 'processing' } : f,
          ),
        )

        // Create conversation if needed
        let conversation = selectedConversation
        if (!conversation?.id) {
          conversation = await createNewConversation(courseName, homeDispatch)
        }

        if (isImageFile) {
          console.log('=== FILE UPLOAD STEP 4A: Processing image file ===')
          // For image files, generate a presigned URL for display
          if (s3Key) {
            const presignedUrl = await fetchPresignedUrl(s3Key, courseName)
            console.log('Generated presigned URL for image:', presignedUrl)
            if (presignedUrl) {
              setFileUploads((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, status: 'completed', url: presignedUrl }
                    : f,
                ),
              )
              console.log('Image file processing completed')
            } else {
              // Fallback to S3 key if presigned URL generation fails
              setFileUploads((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, status: 'completed', url: s3Key }
                    : f,
                ),
              )
              console.log(
                'Image file processing completed (fallback to S3 key)',
              )
            }
          } else {
            // Handle case where s3Key is undefined
            setFileUploads((prev) =>
              prev.map((f) =>
                f.file.name === file.name ? { ...f, status: 'error' } : f,
              ),
            )
            console.log('Image file processing failed: no S3 key')
          }
        } else {
          // For non-image files, use the regular file processing
          const response = await fetch('/api/UIUC-api/chat-file-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: conversation.id,
              courseName: courseName,
              user_id: user_id,
              s3Key: s3Key,
              fileName: file.name,
              fileType: file.type,
              model: conversation.model?.id,
            }),
          })

          if (!response.ok) {
            throw new Error('File too large, please upload a smaller file')
          }

          await response.json()

          // Add a small delay to allow backend processing to complete
          await new Promise((resolve) => setTimeout(resolve, 2000))

          const contexts = await fetchFileUploadContexts(
            conversation.id,
            courseName,
            user_id,
            file.name,
          )

          setFileUploads((prev) =>
            prev.map((f) =>
              f.file.name === file.name
                ? { ...f, status: 'completed', contexts }
                : f,
            ),
          )
        }
      } catch (error) {
        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name ? { ...f, status: 'error' } : f,
          ),
        )
        showErrorToast(
          `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  const theme = useMantineTheme()

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30
    }
  }, [activePromptIndex])

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`
    }
  }, [content])

  useEffect(() => {
    const handleFocus = () => {
      if (chatInputParentContainerRef.current) {
        chatInputParentContainerRef.current.style.boxShadow = `0 0 2px rgba(42,42,120, 1)`
      }
    }

    const handleBlur = () => {
      if (chatInputParentContainerRef.current) {
        chatInputParentContainerRef.current.style.boxShadow = 'none'
      }
    }

    const textArea = textareaRef.current
    textArea?.addEventListener('focus', handleFocus)
    textArea?.addEventListener('blur', handleBlur)

    return () => {
      textArea?.removeEventListener('focus', handleFocus)
      textArea?.removeEventListener('blur', handleBlur)
    }
  }, [textareaRef, chatInputParentContainerRef, isFocused])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false)
      }
    }

    window.addEventListener('click', handleOutsideClick)

    return () => {
      window.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  useEffect(() => {
    // This will focus the div as soon as the component mounts
    if (chatInputContainerRef.current) {
      chatInputContainerRef.current.focus()
    }
  }, [])

  useEffect(() => {
    setContent(inputContent)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [inputContent, textareaRef])

  // Debounce the resize handler to avoid too frequent updates
  const handleResize = useCallback(() => {
    if (textareaRef.current) {
      // Reset height to auto to recalculate
      textareaRef.current.style.height = 'auto'
      // Set new height based on scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      // Update overflow if needed
      textareaRef.current.style.overflow =
        textareaRef.current.scrollHeight > 400 ? 'auto' : 'hidden'
    }
  }, [])

  // Add resize observer effect
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Create resize observer
    const resizeObserver = new ResizeObserver(handleResize)

    // Observe both the textarea and window resize events
    resizeObserver.observe(textarea)
    window.addEventListener('resize', handleResize)

    // Initial size adjustment
    handleResize()

    // Cleanup
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  return (
    <div
      className={`w-full border-transparent bg-transparent pt-6 md:pt-2`}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="stretch mx-2 mt-4 flex flex-col gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          ref={chatInputParentContainerRef}
          className="chat_input_container fixed bottom-0 mx-4 flex w-[80%] flex-col self-center rounded-t-3xl bg-[--message-background] px-4 pb-8 pt-4 text-[--message] md:mx-20 md:w-[60%]"
          style={{ pointerEvents: 'auto', backdropFilter: 'blur(4px)' }}
        >
          {/* Stop generating and regenerate buttons */}
          {messageIsStreaming && (
            <button
              className={`absolute -top-14 left-0 right-0 mx-auto mb-12 flex w-fit items-center gap-3 rounded border border-[--primary] bg-[--primary] px-4 py-2 text-[--background] opacity-[.85] hover:opacity-100 md:mb-0 md:mt-2`}
              onClick={handleStopConversation}
              style={{ pointerEvents: 'auto' }}
            >
              <IconPlayerStop size={16} /> {t('Stop Generating')}
            </button>
          )}

          {!messageIsStreaming &&
            selectedConversation &&
            selectedConversation.messages &&
            selectedConversation.messages.length > 0 &&
            selectedConversation.messages[
              selectedConversation.messages.length - 1
            ]?.role === 'user' && (
              <button
                className={`absolute -top-14 left-0 right-0 mx-auto mb-12 flex w-fit items-center gap-3 rounded border border-[--primary] bg-[--primary] px-4 py-2 text-[--illinois-white] opacity-[.85] hover:opacity-100 md:mb-0 md:mt-2`}
                style={{ pointerEvents: 'auto' }}
                onClick={onRegenerate}
              >
                <IconRepeat size={16} /> {t('Regenerate Response')}
              </button>
            )}

          {/* Chat input and preview container */}
          <div
            ref={chatInputContainerRef}
            className="chat-input-container rbg-[--message-background] m-0 w-full resize-none p-0"
            tabIndex={0}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={() => textareaRef.current?.focus()}
            style={{
              ...chatInputContainerStyle,
              pointerEvents: 'auto',
            }}
          >
            {/* File upload preview section */}
            {fileUploads.length > 0 && (
              <div
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {fileUploads.map((fu, index) => {
                  const getFileIcon = (name: string, type?: string) => {
                    const extension = name.split('.').pop()?.toLowerCase()
                    const iconProps = { size: 20 }

                    if (type?.includes('pdf') || extension === 'pdf') {
                      return (
                        <IconFileTypePdf
                          {...iconProps}
                          style={{ color: 'var(--illinois-orange)' }}
                        />
                      )
                    }
                    if (
                      type?.includes('doc') ||
                      extension === 'docx' ||
                      extension === 'doc'
                    ) {
                      return (
                        <IconFileTypeDocx
                          {...iconProps}
                          style={{ color: 'var(--illinois-orange)' }}
                        />
                      )
                    }
                    if (type?.includes('text') || extension === 'txt') {
                      return (
                        <IconFileTypeTxt
                          {...iconProps}
                          style={{ color: 'var(--illinois-orange)' }}
                        />
                      )
                    }
                    return (
                      <IconFile
                        {...iconProps}
                        style={{ color: 'var(--illinois-orange)' }}
                      />
                    )
                  }

                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case 'uploading':
                      case 'processing':
                        return (
                          <div
                            style={{
                              height: '16px',
                              width: '16px',
                              animation: 'spin 1s linear infinite',
                              borderRadius: '50%',
                              border: '2px solid var(--primary)',
                              borderTopColor: 'transparent',
                            }}
                          />
                        )
                      case 'completed':
                        return (
                          <div
                            style={{
                              display: 'flex',
                              height: '16px',
                              width: '16px',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              backgroundColor: 'var(--illinois-prairie)',
                            }}
                          >
                            <svg
                              style={{
                                height: '10px',
                                width: '10px',
                                color: 'white',
                              }}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )
                      case 'error':
                        return (
                          <div
                            style={{
                              display: 'flex',
                              height: '16px',
                              width: '16px',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              backgroundColor: 'var(--destructive)',
                            }}
                          >
                            <svg
                              style={{
                                height: '10px',
                                width: '10px',
                                color: 'white',
                              }}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )
                      default:
                        return null
                    }
                  }

                  const truncateFileName = (name: string, maxLength = 25) => {
                    if (name.length <= maxLength) return name
                    const extension = name.split('.').pop()
                    const nameWithoutExt = name.substring(
                      0,
                      name.lastIndexOf('.'),
                    )
                    return `${nameWithoutExt.substring(0, maxLength - 3)}...${extension ? `.${extension}` : ''}`
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background-faded)',
                        padding: '8px 12px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {getFileIcon(fu.file.name, fu.file.type)}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: 'var(--foreground)',
                          }}
                        >
                          {truncateFileName(fu.file.name)}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--foreground-faded)',
                          }}
                        >
                          {fu.status === 'uploading' && 'Uploading...'}
                          {fu.status === 'processing' && 'Processing...'}
                          {fu.status === 'completed' && 'Ready for chat'}
                          {fu.status === 'error' && 'Upload failed'}
                        </span>
                      </div>
                      {getStatusIcon(fu.status)}
                      <button
                        onClick={() => {
                          setFileUploads((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }}
                        style={{
                          marginLeft: '8px',
                          color: 'var(--foreground-faded)',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--foreground)'
                          e.currentTarget.style.backgroundColor =
                            'var(--background-dark)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            'var(--foreground-faded)'
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <IconX size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Main input area */}
            <div className="relative flex w-full items-center">
              {/* File upload button */}
              <button
                className="mr-2 flex items-center justify-center rounded-full p-2 text-neutral-100 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
                onClick={() => fileUploadRef.current?.click()}
                type="button"
                title="Upload files"
                style={{ pointerEvents: 'auto' }}
              >
                <IconPaperclip size={20} />
              </button>
              <input
                type="file"
                multiple
                ref={fileUploadRef}
                style={{ display: 'none', pointerEvents: 'auto' }}
                accept={ALLOWED_FILE_EXTENSIONS.map((ext) => '.' + ext).join(
                  ',',
                )}
                onChange={(e) => {
                  const files = e.target.files
                  if (files) {
                    handleFileSelection(Array.from(files))
                  }
                  // Reset input value so the same file can be selected again
                  if (fileUploadRef.current) {
                    fileUploadRef.current.value = ''
                  }
                }}
              />

              {/* Textarea for message input */}
              <textarea
                ref={textareaRef}
                className="chat-input m-0 h-[24px] max-h-[400px] w-full flex-1 resize-none bg-transparent py-2 pl-2 pr-12 text-white outline-none"
                style={{
                  resize: 'none',
                  minHeight: '24px',
                  height: 'auto',
                  maxHeight: '400px',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                }}
                placeholder={'Message Illinois Chat'}
                value={content}
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              {/* Send button */}
              <button
                className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center justify-center rounded-full bg-[white/30] p-2 opacity-50 hover:opacity-100"
                onClick={handleSend}
                style={{ pointerEvents: 'auto' }}
              >
                {messageIsStreaming ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60"></div>
                ) : (
                  <IconSend size={18} />
                )}
              </button>
            </div>

            {showPluginSelect && (
              <div
                className="absolute bottom-14 left-0 rounded bg-white dark:bg-[#15162c]"
                style={{ pointerEvents: 'auto' }}
              >
                <PluginSelect
                  plugin={plugin}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      setShowPluginSelect(false)
                      textareaRef.current?.focus()
                    }
                  }}
                  onPluginChange={(plugin: Plugin) => {
                    setPlugin(plugin)
                    setShowPluginSelect(false)

                    if (textareaRef && textareaRef.current) {
                      textareaRef.current.focus()
                    }
                  }}
                />
              </div>
            )}

            {showScrollDownButton && (
              <div className="absolute bottom-2 right-10 lg:-right-10 lg:bottom-0">
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[--background-faded] text-[--foreground] hover:bg-[--background-dark] focus:outline-none"
                  onClick={onScrollDownClick}
                  style={{ pointerEvents: 'auto' }}
                >
                  <IconArrowDown size={18} />
                </button>
              </div>
            )}

            {showPromptList && filteredPrompts.length > 0 && (
              <div
                className="absolute bottom-12 w-full"
                style={{ pointerEvents: 'auto' }}
              >
                <PromptList
                  activePromptIndex={activePromptIndex}
                  prompts={filteredPrompts}
                  onSelect={handleInitModal}
                  onMouseOver={setActivePromptIndex}
                  promptListRef={promptListRef}
                />
              </div>
            )}

            {isModalVisible && filteredPrompts[activePromptIndex] && (
              <div style={{ pointerEvents: 'auto' }}>
                <VariableModal
                  prompt={filteredPrompts[activePromptIndex]}
                  variables={variables}
                  onSubmit={handleSubmit}
                  onClose={() => setIsModalVisible(false)}
                />
              </div>
            )}
          </div>

          <Text
            size={isSmallScreen ? '10px' : 'xs'}
            className={`font-montserratHeading ${montserrat_heading.variable} absolute bottom-[.35rem] left-5 -ml-2 flex items-center gap-1 break-words rounded-full px-3 py-1 text-[--message-faded] opacity-60 hover:bg-white/20 hover:text-[--message] hover:opacity-100`}
            onClick={handleTextClick}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            {selectBestModel(llmProviders)?.name}
            {selectedConversation?.model &&
              webLLMModels.some(
                (m) => m.name === selectedConversation?.model?.name,
              ) &&
              chat_ui?.isModelLoading() &&
              '  Please wait while the model is loading...'}
            <IconChevronRight size={isSmallScreen ? '10px' : '13px'} />
          </Text>
          {showModelSettings && (
            <div
              ref={modelSelectContainerRef}
              style={{
                position: 'absolute',
                zIndex: 100,
                right: '30px',
                top: '75px',
                pointerEvents: 'auto',
              }}
            >
              <UserSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
