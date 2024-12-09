// chatinput.tsx
import {
  IconArrowDown,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconPhoto,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react'
import { Text } from '@mantine/core'
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from 'next-i18next'
import { Content, Message, MessageType } from '@/types/chat'
import { Plugin } from '@/types/plugin'
import { Prompt } from '@/types/prompt'

import HomeContext from '~/pages/api/home/home.context'

import { PluginSelect } from './PluginSelect'
import { PromptList } from './PromptList'
import { VariableModal } from './VariableModal'

import { notifications } from '@mantine/notifications'
import { useMantineTheme, Tooltip } from '@mantine/core'
import { Montserrat } from 'next/font/google'

import React from 'react'

import { CSSProperties } from 'react'

import { fetchPresignedUrl, uploadToS3 } from 'src/utils/apiUtils'
import { ImagePreview } from './ImagePreview'
import { montserrat_heading } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import ChatUI, {
  WebllmModel,
  webLLMModels,
} from '~/utils/modelProviders/WebLLM'
import { VisionCapableModels } from '~/utils/modelProviders/LLMProvider'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { UserSettings } from '~/components/Chat/UserSettings'
import { IconChevronRight } from '@tabler/icons-react'
import { showConfirmationToast } from '../UIUC-Components/api-inputs/LLMsApiKeyInputForm'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void
  onRegenerate: () => void
  onScrollDownClick: () => void
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  showScrollDownButton: boolean
  inputContent: string
  setInputContent: (content: string) => void
  courseName: string
  chat_ui?: ChatUI
}

interface ProcessedImage {
  resizedFile: File
  dataUrl: string
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  inputContent,
  setInputContent,
  courseName,
  chat_ui,
}: Props) => {
  const { t } = useTranslation('chat')

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts,
      showModelSettings,
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
    backgroundColor: '#A9A9A9', // Changed to a darker gray
    color: 'white', // White icon color
    border: '2px solid white', // White border
    cursor: 'pointer',
    zIndex: 2,
  }

  const removeButtonHoverStyle: CSSProperties = {
    backgroundColor: '#505050', // Even darker gray for hover state
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
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      )
      return
    }

    setContent(value)
    updatePromptListVisibility(value)
  }
  // Assuming Message, Role, and Plugin types are already defined in your codebase

  type Role = 'user' | 'system' // Add other roles as needed

  const handleSend = async () => {
    if (messageIsStreaming) {
      return
    }

    const textContent = content
    let imageContent: Content[] = [] // Explicitly declare the type for imageContent

    if (imageFiles.length > 0 && !uploadingImage) {
      setUploadingImage(true)
      try {
        // If imageUrls is empty, upload all images and get their URLs
        const imageUrlsToUse =
          imageUrls.length > 0
            ? imageUrls
            : await Promise.all(
                imageFiles.map((file) =>
                  uploadImageAndGetUrl(file, courseName),
                ),
              )

        // Construct image content for the message
        imageContent = imageUrlsToUse
          .filter((url): url is string => url !== '') // Type-guard to filter out empty strings
          .map((url) => ({
            type: 'image_url',
            image_url: { url },
          }))

        // console.log("Final imageUrls: ", imageContent)

        // Clear the files after uploading
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

    if (!textContent && imageContent.length === 0) {
      alert(t('Please enter a message or upload an image'))
      return
    }

    // Construct the content array
    const contentArray: Content[] = [
      ...(textContent
        ? [{ type: 'text' as MessageType, text: textContent }]
        : []),
      ...imageContent,
    ]

    // Create a structured message for GPT-4 Vision
    const messageForGPT4Vision: Message = {
      id: uuidv4(),
      role: 'user',
      content: contentArray,
    }

    // Use the onSend prop to send the structured message
    onSend(messageForGPT4Vision, plugin) // Cast to unknown then to Message if needed

    // Reset states
    setContent('')
    setPlugin(null)
    setImagePreviews([])
    setImageUrls([])
    setImageFiles([])
    setImagePreviewUrls([])

    if (imageUploadRef.current) {
      imageUploadRef.current.value = ''
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
      showConfirmationToast({
        title: `😢 We can't handle all these images...`,
        message: `Image uploads are temporarily disabled. I'm really sorry, I'm working on getting them back. Email me if you want to complain: kvday2@illinois.edu`,
        isError: true,
        autoClose: 10000,
      })

      // Clear any selected files
      if (imageUploadRef.current) {
        imageUploadRef.current.value = ''
      }
      return // Exit early to prevent processing

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
      const presignedUrl = await fetchPresignedUrl(uploadedImageUrl as string)
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

  return (
    <div
      className={`absolute bottom-0 left-0 w-full border-transparent bg-transparent pt-6 dark:border-white/20 md:pt-2`}
    >
      <div className="stretch mx-2 mt-4 flex flex-col gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
        {messageIsStreaming && (
          <button
            className={`absolute ${isSmallScreen ? '-top-28' : '-top-20'} left-0 right-0 mx-auto mb-12 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-2 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#15162c] dark:text-white md:mb-0 md:mt-2`}
            onClick={handleStopConversation}
          >
            <IconPlayerStop size={16} /> {t('Stop Generating')}
          </button>
        )}

        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages &&
          selectedConversation.messages?.length > 0 && (
            <button
              className={`absolute ${isSmallScreen ? '-top-28' : '-top-20'} left-0 right-0 mx-auto mb-24 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-2 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2`}
              onClick={onRegenerate}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

        <div
          ref={chatInputParentContainerRef}
          className="absolute bottom-0 mx-4 flex w-[80%] flex-col self-center rounded-t-3xl border border-black/10 bg-[#070712] px-4 pb-8 pt-4 shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] md:mx-20 md:w-[70%]"
        >
          {/* BUTTON 2: Image Icon and Input */}
          {selectedConversation?.model?.id &&
            VisionCapableModels.has(
              selectedConversation.model?.id as OpenAIModelID,
            ) && (
              <button
                className="absolute bottom-11 left-5 rounded-full p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
                onClick={() => document.getElementById('imageUpload')?.click()}
              >
                <div className="">
                  <IconPhoto size={22} />
                </div>
              </button>
            )}
          <input
            type="file"
            multiple
            id="imageUpload"
            ref={imageUploadRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files
              if (files) {
                handleImageUpload(Array.from(files))
              }
            }}
          />

          {showPluginSelect && (
            <div className="absolute bottom-14 left-0 rounded bg-white dark:bg-[#15162c]">
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
            className="chat-input-container m-0 w-full resize-none bg-[#070712] p-0 text-black dark:bg-[#070712] dark:text-white"
            tabIndex={0}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={() => textareaRef.current?.focus()} // Add this line
            style={{
              ...chatInputContainerStyle, // Apply the dynamic padding here
            }}
          >
            {/* Image preview section */}
            <div
              className="flex space-x-3"
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
                      backgroundColor: '#2b2b2b',
                      color: 'white',
                    }}
                  >
                    <button
                      className="remove-button"
                      onClick={() => {
                        // Filter out the image from both imageFiles and imagePreviewUrls
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
                      <IconX size={16} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>

            {/* Button 3: main input text area  */}
            <div
              className={`
                ${
                  VisionCapableModels.has(
                    selectedConversation?.model?.id as OpenAIModelID,
                  )
                    ? 'pl-8'
                    : 'pl-1'
                }
                  `}
            >
              <textarea
                ref={textareaRef}
                className={`chat-input m-0 h-[24px] max-h-[400px] w-full resize-none bg-transparent py-2 pr-8 pl-2 text-white outline-none ${
                  isFocused ? 'border-blue-500' : ''
                }`}
                style={{
                  resize: 'none',
                  bottom: `${textareaRef?.current?.scrollHeight}px`,
                  maxHeight: '400px',
                  overflow: `${
                    textareaRef.current && textareaRef.current.scrollHeight > 400
                      ? 'auto'
                      : 'hidden'
                  }`,
                }}
                placeholder={
                  t('Type a message or type "/" to select a prompt...') || ''
                }
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

            <button
              className="absolute bottom-11 right-5 rounded-full p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={handleSend}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
              ) : (
                <IconSend size={18} />
              )}
            </button>

            {showScrollDownButton && (
              <div className="absolute bottom-12 right-0 lg:-right-10 lg:bottom-0">
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                  onClick={onScrollDownClick}
                >
                  <IconArrowDown size={18} />
                </button>
              </div>
            )}

            {showPromptList && filteredPrompts.length > 0 && (
              <div className="absolute bottom-12 w-full">
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
              <VariableModal
                prompt={filteredPrompts[activePromptIndex]}
                variables={variables}
                onSubmit={handleSubmit}
                onClose={() => setIsModalVisible(false)}
              />
            )}
          </div>

          <Text
            size={isSmallScreen ? '10px' : 'xs'}
            className={`font-montserratHeading ${montserrat_heading.variable} absolute bottom-2 left-5 break-words rounded-full p-1 text-neutral-400 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200`}
            tt={'capitalize'}
            onClick={handleTextClick}
            style={{ cursor: 'pointer' }}
          >
            {selectedConversation?.model?.name}
            {selectedConversation?.model &&
              webLLMModels.some(
                (m) => m.name === selectedConversation?.model?.name,
              ) &&
              chat_ui?.isModelLoading() &&
              '  Please wait while the model is loading...'}
            <IconChevronRight
              size={isSmallScreen ? '10px' : '13px'}
              style={{
                marginLeft: '2px',
                marginBottom: isSmallScreen ? '2px' : '4px',
                display: 'inline-block',
              }}
            />
          </Text>
          {showModelSettings && (
            <div
              ref={modelSelectContainerRef}
              style={{
                position: 'absolute',
                zIndex: 100,
                right: '30px',
                top: '75px',
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
