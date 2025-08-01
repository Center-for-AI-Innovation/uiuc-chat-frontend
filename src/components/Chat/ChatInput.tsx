// chatinput.tsx
import { type Content, type Message, type MessageType } from '@/types/chat'
import { type Plugin } from '@/types/plugin'
import { type Prompt } from '@/types/prompt'
import { Text } from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowDown,
  IconPhoto,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconX,
  IconPlus,
  IconFileTypeTxt,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypePpt,
  IconFileTypeXls,
  IconCheck,
  IconFile,
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
import { useTranslation } from 'next-i18next'
import { Content, Message, MessageType, Conversation } from '@/types/chat'
import { Plugin } from '@/types/plugin'
import { Prompt } from '@/types/prompt'

import HomeContext from '~/pages/api/home/home.context'

import { PluginSelect } from './PluginSelect'
import { PromptList } from './PromptList'
import { VariableModal } from './VariableModal'

import { Tooltip, useMantineTheme } from '@mantine/core'
import { notifications } from '@mantine/notifications'
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
import { ImagePreview } from './ImagePreview'
import { ContextWithMetadata } from '~/types/chat'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
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
]

type FileUploadStatus = {
  file: File
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error' // Add 'processing' and 'completed'
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
  courseName: string
  chat_ui?: ChatUI
  onRegenerate?: () => void
}

interface ProcessedImage {
  resizedFile: File
  dataUrl: string
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
  fileName: string,
): Promise<ContextWithMetadata[]> {
  try {
    const response = await fetch('/api/getContexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_name: courseName,
        search_query: fileName,
        token_limit: 4000,
        doc_groups: ['All Documents'],
        conversation_id: conversationId,
      }),
    })

    if (!response.ok) {
      console.error('Failed to fetch file contexts:', response.status)
    }

    const data = await response.json()
    
    //Check if data is an array before filtering
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format')
    }

    const filteredContexts = data.filter((context: any) => 
      context.readable_filename === fileName
    )
        
    return filteredContexts
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
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const imageUploadRef = useRef<HTMLInputElement | null>(null)
  const promptListRef = useRef<HTMLUListElement | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const chatInputContainerRef = useRef<HTMLDivElement>(null)
  const chatInputParentContainerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
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
    console.log('handleTextClick')
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
    backgroundColor: 'var(--message-background)', // Changed to a darker gray
    color: 'rgba(from var(--message) r g b / .35)', // White icon color
    //    border: '1px solid rgba(from var(--foreground) r g b / .5)', // White border
    cursor: 'pointer',
    zIndex: 2,
  }

  const removeButtonHoverStyle: CSSProperties = {
    color: 'var(--message)',
    backgroundColor: 'var(--message-background)',
    borderColor: 'var(--foreground)',
    //    backgroundColor: 'var(--background)', // Even darker gray for hover state
  }

  // Dynamically set the padding based on image previews presence
  const chatInputContainerStyle: CSSProperties = {
    paddingTop: imagePreviewUrls.length > 0 ? '10px' : '0',
    paddingRight: imagePreviewUrls.length > 0 ? '10px' : '0',
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
  // Assuming Message, Role, and Plugin types are already defined in your codebase

  type Role = 'user' | 'system' // Add other roles as needed

  const handleSend = async () => {
    const hasProcessingFiles = fileUploads.some(
      (fu) =>
        fu.status === 'processing' ||
        fu.status === 'uploading' ||
        fu.status === 'uploaded',
    )

    if (messageIsStreaming || hasProcessingFiles) {
      // ✅ Show notification to user
      if (hasProcessingFiles) {
        notifications.show({
          title: 'Files Processing',
          message: 'Please wait for all files to finish processing',
          color: 'yellow',
        })
      }
      return
    }

    const textContent = content
    let imageContent: Content[] = []  
    let fileContent: Content[] = []

    // Handle image uploads (existing code - keep this as is)
    if (imageFiles.length > 0 && !uploadingImage) {
      setUploadingImage(true)
      try {
        const imageUrlsToUse =
          imageUrls.length > 0
            ? imageUrls
            : await Promise.all(
                imageFiles.map((file) =>
                  uploadImageAndGetUrl(file, courseName),
                ),
              )

        imageContent = imageUrlsToUse
          .filter((url): url is string => url !== '')
          .map((url) => ({
            type: 'image_url',
            image_url: { url },
          }))

        setImageFiles([])
        setImagePreviewUrls([])
        setImageUrls([])
      } catch (error) {
        console.error('Error uploading files:', error)
        setImageError('Error uploading files')
      } finally {
        setUploadingImage(false)
      }
    }

    // Handle file uploads: Only proceed if all files are completed
    const allFileContexts: ContextWithMetadata[] = [] // ✅ Change to const
    
    if (fileUploads.length > 0) {
      const pendingFiles = fileUploads.filter((fu) => fu.status !== 'completed')

      if (pendingFiles.length > 0) {
        notifications.show({
          title: 'Files Still Processing',
          message:
            'Please wait for all files to finish processing before sending',
          color: 'yellow',
        })
        return
      }

      // Create file content for the message (files are already processed)
      fileContent = fileUploads
        .filter((fu) => fu.status === 'completed')
        .map((fu) => {
          if (fu.contexts && Array.isArray(fu.contexts)) {
            allFileContexts.push(...fu.contexts) // This will still work with const
          }
          return {
            type: 'text' as MessageType,
            text: `📎 Uploaded file: ${fu.file.name}|${fu.url}|${fu.file.type}`,
          }
        })

      setFileUploads([]) // Clear after using
    }

    if (!textContent && imageContent.length === 0 && fileContent.length === 0) {
      alert(t('Please enter a message or upload a file'))
      return
    }

    // Construct the content array
    const contentArray: Content[] = [
      ...(textContent
        ? [{ type: 'text' as MessageType, text: textContent }]
        : []),
      ...imageContent,
      ...fileContent,
    ]

    // Create a structured message
    const messageForChat: Message = {
      id: uuidv4(),
      role: 'user',
      content: contentArray,
      contexts: allFileContexts.length > 0 ? allFileContexts : undefined, //Include contexts
    }

    // Use the onSend prop to send the structured message
    onSend(messageForChat, plugin)

    // Reset states
    setContent('')
    setPlugin(null)
    setImagePreviews([])
    setImageUrls([])
    setImageFiles([])
    setImagePreviewUrls([])
    setFileUploads([])

    if (imageUploadRef.current) {
      imageUploadRef.current.value = ''
    }
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
      // ... existing image handling code ...

      const response = await fetch('/api/allNewRoutingChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: selectedConversation,
          // key: apiKey,
          course_name: courseName,
          // courseMetadata: courseMetadata,
          stream: true,
          // llmProviders: llmProviders,
        }),
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        const errorMessage =
          errorResponse.error ||
          'An error occurred while processing your request'
        notifications.show({
          message: errorMessage,
          color: 'red',
        })
        return
      }

      // ... rest of success handling ...
    } catch (error) {
      console.error('Error in chat submission:', error)
      notifications.show({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send message. Please try again.',
        color: 'red',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // https://platform.openai.com/docs/guides/vision/what-type-of-files-can-i-upload
  const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

  const isImageValid = (fileName: string): boolean => {
    const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
    return validImageTypes.includes(`.${ext}`)
  }

  const showToastOnInvalidImage = useCallback(() => {
    notifications.show({
      id: 'error-notification',
      withCloseButton: true,
      onClose: () => console.log('error unmounted'),
      onOpen: () => console.log('error mounted'),
      autoClose: 8000,
      title: 'Invalid Image Type',
      message: 'Unsupported file type. Please upload .jpg or .png images.',
      color: 'red',
      radius: 'lg',
      icon: <IconAlertCircle />,
      className: 'my-notification-class',
      style: { backgroundColor: '#15162c' },
      withBorder: true,
      loading: false,
    })
  }, [])

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      // TODO: FIX IMAGE UPLOADS ASAP
      // showConfirmationToast({
      //   title: `😢 We can't handle all these images...`,
      //   message: `Image uploads are temporarily disabled. I'm really sorry, I'm working on getting them back. Email me if you want to complain: rohan13@illinois.edu`,
      //   isError: true,
      //   autoClose: 10000,
      // })

      // Clear any selected files
      if (imageUploadRef.current) {
        imageUploadRef.current.value = ''
      }
      // return // Exit early to prevent processing

      const validFiles = files.filter((file) => isImageValid(file.name))
      const invalidFilesCount = files.length - validFiles.length

      if (invalidFilesCount > 0) {
        setImageError(
          `${invalidFilesCount} invalid file type(s). Please upload .jpg or .png images.`,
        )
        showToastOnInvalidImage()
      }

      const imageProcessingPromises = validFiles.map((file) =>
        processAndUploadImage(file),
      )

      try {
        const processedImages = await Promise.all(imageProcessingPromises)
        const newImageFiles = processedImages.map((img) => img.resizedFile)
        const newImagePreviewUrls = processedImages.map((img) => img.dataUrl)
        const newImageUrls = processedImages.map((img) => img.uploadedUrl)

        setImageFiles((prev) => [...prev, ...newImageFiles])
        setImagePreviewUrls((prev) => [...prev, ...newImagePreviewUrls])
        setImageUrls((prev) => [...prev, ...newImageUrls.filter(Boolean)])
      } catch (error) {
        console.error('Error processing files:', error)
      }
    },
    [
      setImageError,
      setImageFiles,
      setImagePreviewUrls,
      setImageUrls,
      showToastOnInvalidImage,
      courseName,
    ],
  )

  async function handleFileSelection(newFiles: File[]) {
    const allFiles = [...fileUploads.map((f) => f.file), ...newFiles]

    // 1. Validation: number of files
    if (allFiles.length > 5) {
      notifications.show({
        title: 'Too Many Files',
        message:
          'You can upload a maximum of 5 files at once. Please remove some files before adding new ones.',
        color: 'red',
        icon: <IconAlertCircle />,
        autoClose: 6000,
      })
      return
    }

    // 2. Validation: total size
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 25 * 1024 * 1024) {
      notifications.show({
        title: 'Files Too Large',
        message:
          'The total size of all files cannot exceed 25MB. Please remove large files or upload smaller ones.',
        color: 'red',
        icon: <IconAlertCircle />,
        autoClose: 6000,
      })
      return
    }

    // 3. Validation: file types
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        notifications.show({
          title: 'Unsupported File Type',
          message: `The file "${file.name}" is not supported. Please upload files of the following types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}.`,
          color: 'red',
          icon: <IconAlertCircle />,
          autoClose: 6000,
        })
        return
      }
    }

    // Prevent duplicates by name
    const existingNames = new Set(fileUploads.map((fu) => fu.file.name))
    const uniqueNewFiles = newFiles.filter(
      (file) => !existingNames.has(file.name),
    )

    if (uniqueNewFiles.length === 0) {
      notifications.show({
        title: 'Duplicate Files',
        message: 'All selected files are already uploaded or in progress.',
        color: 'yellow',
        icon: <IconAlertCircle />,
        autoClose: 6000,
      })
      return
    }

    for (const file of uniqueNewFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const imageTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif']

      // If image, generate preview for UI
      if (ext && imageTypes.includes(ext)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setImagePreviewUrls((prev) => [...prev, dataUrl])
          setImageFiles((prev) => [...prev, file])
        }
        reader.readAsDataURL(file)
      } else {
        // For non-image files, just add to fileUploads
        setFileUploads((prev) => [
          ...prev,
          {
            file,
            status: 'uploading' as const,
          },
        ])
      }

      // Upload all files (including images) to S3 and update status
      try {
        const s3Key = await uploadToS3(file, courseName)
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

        // Process the file immediately
        const response = await fetch('/api/UIUC-api/chat-file-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            courseName: courseName,
            s3Key: s3Key,
            fileName: file.name,
            fileType: file.type,
            model: conversation.model?.id,
          }),
        })

        if (!response.ok) {
          throw new Error('File processing failed')
        }

        const result = await response.json()
        console.log('File processing completed:', result)
        
        const contexts = await fetchFileUploadContexts(
          conversation.id,
          courseName,
          file.name,
        )
        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name
              ? { ...f, status: 'completed', contexts }
              : f,
          ),
        )
      } catch (error) {
        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name ? { ...f, status: 'error' } : f,
          ),
        )
        notifications.show({
          message: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          color: 'red',
        })
      }
    }
  }

  async function processAndUploadImage(
    file: File,
  ): Promise<ProcessedImage & { uploadedUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onloadend = async () => {
        const result = reader.result
        if (typeof result === 'string') {
          const img = new Image()
          img.src = result

          img.onload = async () => {
            const { newWidth, newHeight } = calculateDimensions(img)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (ctx) {
              canvas.width = newWidth
              canvas.height = newHeight
              ctx.drawImage(img, 0, 0, newWidth, newHeight)

              canvas.toBlob(
                async (blob) => {
                  if (blob) {
                    const resizedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    })

                    const uploadedUrl = await uploadImageAndGetUrl(
                      resizedFile,
                      courseName,
                    )
                    resolve({
                      resizedFile,
                      dataUrl: canvas.toDataURL('image/jpeg'),
                      uploadedUrl,
                    })
                  } else {
                    reject(new Error('Canvas toBlob failed'))
                  }
                },
                'image/jpeg',
                0.9,
              )
            } else {
              reject(new Error('Canvas Context is null'))
            }
          }
        } else {
          reject(new Error('FileReader did not return a string result'))
        }
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function calculateDimensions(img: HTMLImageElement): {
    newWidth: number
    newHeight: number
  } {
    const MAX_WIDTH = 2048
    const MAX_HEIGHT = 2048
    const MIN_SIDE = 768

    let newWidth, newHeight
    if (img.width > img.height) {
      newHeight = MIN_SIDE
      newWidth = (img.width / img.height) * newHeight
      if (newWidth > MAX_WIDTH) {
        newWidth = MAX_WIDTH
        newHeight = (img.height / img.width) * newWidth
      }
    } else {
      newWidth = MIN_SIDE
      newHeight = (img.height / img.width) * newWidth
      if (newHeight > MAX_HEIGHT) {
        newHeight = MAX_HEIGHT
        newWidth = (img.width / img.height) * newHeight
      }
    }
    return { newWidth, newHeight }
  }

  // Function to open the modal with the selected image
  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc)
    setIsModalOpen(true)
  }

  const theme = useMantineTheme()

  useEffect(() => {
    if (
      !VisionCapableModels.has(selectedConversation?.model?.id as OpenAIModelID)
    ) {
      return // Exit early if the model is not GPT-4 Vision
    }

    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (
        e.dataTransfer &&
        e.dataTransfer.items &&
        e.dataTransfer.items.length > 0
      ) {
        const files = Array.from(e.dataTransfer.items)
          .filter((item) => item.kind === 'file')
          .map((item) => item.getAsFile())
          .filter((file) => file !== null) as File[]
        if (files.length > 0) {
          handleImageUpload(files)
        }
      }
    }

    const handleDocumentDragLeave = (e: DragEvent) => {
      setIsDragging(false)
    }

    document.addEventListener('dragover', handleDocumentDragOver)
    document.addEventListener('drop', handleDocumentDrop)
    document.addEventListener('dragleave', handleDocumentDragLeave)

    return () => {
      // Clean up the event listeners when the component is unmounted
      document.removeEventListener('dragover', handleDocumentDragOver)
      document.removeEventListener('drop', handleDocumentDrop)
      document.removeEventListener('dragleave', handleDocumentDragLeave)
    }
  }, [handleImageUpload, selectedConversation?.model?.id])

  useEffect(() => {
    if (imageError) {
      showToastOnInvalidImage()
      setImageError(null)
    }
  }, [imageError, showToastOnInvalidImage])

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

  // This is where we upload images and generate their presigned url
  async function uploadImageAndGetUrl(
    file: File,
    courseName: string,
  ): Promise<string> {
    try {
      const uploadedImageUrl = await uploadToS3(file, courseName)
      const presignedUrl = await fetchPresignedUrl(
        uploadedImageUrl as string,
        courseName,
      )
      return presignedUrl as string
    } catch (error) {
      console.error('Upload failed for file', file.name, error)
      setImageError(`Upload failed for file: ${file.name}`)
      return ''
    }
  }

  // // Toggle to enable Fancy retrieval method: Multi-Query Retrieval
  // const [useMQRetrieval, setUseMQRetrieval] = useState(localStorage.getItem('UseMQRetrieval') === 'true');
  // // Update localStorage whenever useMQRetrieval changes
  // useEffect(() => {
  //   localStorage.setItem('UseMQRetrieval', useMQRetrieval ? 'true' : 'false');
  // }, [useMQRetrieval]);

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
          {/* FUTURE: rewrite to be flex instead of using absolute */}

          {/* moved stop generating and regenerate buttons here to position off of bottom input area...as textarea varies in height */}
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

        {fileUploads.map((fu, index) => (
          <div key={index} className="mb-1 text-sm text-neutral-500">
            📎 {fu.file.name}
          </div>
        ))}

        <div
          ref={chatInputParentContainerRef}
          className="absolute bottom-0 mx-4 flex w-[80%] flex-col self-center rounded-t-3xl border border-black/10 bg-[#070712] px-4 pb-8 pt-4 shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] md:mx-20 md:w-[70%]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Flex row for upload buttons and textarea */}
          <div className="flex w-full items-center">
            <>
              {/* Image upload button: only for vision-capable models */}
              {VisionCapableModels.has(
                selectedConversation?.model?.id as OpenAIModelID,
              ) && (
                <>
                  <button
                    className="mr-2 rounded-full p-1 text-neutral-100 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
                    onClick={() => imageUploadRef.current?.click()}
                    type="button"
                    title="Upload image"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <IconPhoto size={22} />
                  </button>
                  <input
                    type="file"
                    multiple
                    id="imageUpload"
                    ref={imageUploadRef}
                    style={{ display: 'none', pointerEvents: 'auto' }}
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        handleImageUpload(Array.from(files))
                      }
                      // Reset input value so the same file can be selected again
                      if (imageUploadRef.current) {
                        imageUploadRef.current.value = ''
                      }
                    }}
                  />
                </>
              )}
              {/* File upload button (plus sign): always visible */}
              <button
                className="mr-2 rounded-full p-1 text-neutral-100 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
                onClick={() => fileUploadRef.current?.click()}
                type="button"
                title="Upload files"
                style={{ pointerEvents: 'auto' }}
              >
                <IconPlus size={22} />
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
            </>
            {/* Textarea for message input */}
            <textarea
              ref={textareaRef}
              className="chat-input m-0 h-[24px] max-h-[400px] w-full flex-1 resize-none bg-transparent py-2 pl-2 pr-8 text-white outline-none"
              style={{
                resize: 'none',
                minHeight: '24px',
                height: 'auto',
                maxHeight: '400px',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
              placeholder={'Message UIUC.chat'}
              value={content}
              rows={1}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {showPluginSelect && (
            <div
              className="absolute bottom-14 left-0 rounded"
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
            {/* Image preview section */}
            <div
              className="ml-10 flex space-x-3"
              style={{ display: imagePreviewUrls.length > 0 ? 'flex' : 'none' }}
            >
              {imagePreviewUrls.map((src, index) => (
                <div key={src} className="relative h-12 w-12">
                  <ImagePreview
                    src={src}
                    alt={`Preview ${index}`}
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <Tooltip
                    label="Remove File"
                    position="top"
                    withArrow
                    style={{
                      color: 'var(--tooltip)',
                      backgroundColor: 'var(--tooltip-background)',
                    }}
                  >
                    <button
                      className="remove-button"
                      onClick={() => {
                        setImageFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                        setImagePreviewUrls((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }}
                      style={removeButtonStyle}
                      onMouseEnter={(e) => {
                        const current = e.currentTarget
                        current.style.backgroundColor =
                          removeButtonHoverStyle.backgroundColor!
                        current.style.color = removeButtonHoverStyle.color!
                      }}
                      onMouseLeave={(e) => {
                        const current = e.currentTarget
                        current.style.backgroundColor =
                          removeButtonStyle.backgroundColor!
                        current.style.color = removeButtonStyle.color!
                      }}
                    >
                      <IconX size={'.85rem'} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>

            {/* File upload preview section */}
            <div className="mt-2 flex flex-wrap gap-3">
              {fileUploads.map((fu, index) => {
                const getFileIcon = (name: string, type?: string) => {
                  const extension = name.split('.').pop()?.toLowerCase()
                  const iconProps = { size: 20 }

                  if (type?.includes('pdf') || extension === 'pdf') {
                    return (
                      <IconFileTypePdf
                        {...iconProps}
                        className="text-red-500"
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
                        className="text-blue-500"
                      />
                    )
                  }
                  if (type?.includes('text') || extension === 'txt') {
                    return (
                      <IconFileTypeTxt
                        {...iconProps}
                        className="text-gray-500"
                      />
                    )
                  }
                  return <IconFile {...iconProps} className="text-gray-600" />
                }

                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'uploading':
                    case 'processing':
                      return (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      )
                    case 'completed':
                      return (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                          <svg
                            className="h-2.5 w-2.5 text-white"
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
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                          <svg
                            className="h-2.5 w-2.5 text-white"
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
                    className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                  >
                    {getFileIcon(fu.file.name, fu.file.type)}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">
                        {truncateFileName(fu.file.name)}
                      </span>
                      <span className="text-xs text-gray-500">
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
                      className="ml-2 text-gray-400 hover:text-gray-300"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              className="absolute bottom-[2.25rem] right-5 rounded-full bg-[white/30] p-2 opacity-50 hover:opacity-100"
              onClick={handleSend}
              style={{ pointerEvents: 'auto' }}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60"></div>
              ) : (
                <IconSend size={18} />
              )}
            </button>

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
