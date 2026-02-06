import {
  type Content,
  type Message,
  type MessageType,
  type Conversation,
} from '@/types/chat'
import { type Plugin } from '@/types/plugin'
import { Text } from '@mantine/core'
import {
  IconArrowDown,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconX,
  IconPaperclip,
} from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import {
  type KeyboardEvent,
  type MutableRefObject,
  useContext,
  useRef,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'

import HomeContext from '~/pages/api/home/home.context'

import { PluginSelect } from './PluginSelect'
import { PromptList } from './PromptList'
import { VariableModal } from './VariableModal'
import { FileUploadPreview } from './FileUploadPreview'

import { Tooltip, useMantineTheme } from '@mantine/core'
import { showErrorToast, showWarningToast } from '~/utils/toastUtils'

import React from 'react'

import { type CSSProperties } from 'react'

import { useMediaQuery } from '@mantine/hooks'
import { IconChevronRight } from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import { useFileUpload } from '~/hooks/useFileUpload'
import { usePromptAutocomplete } from '~/hooks/usePromptAutocomplete'
import { useTextareaAutosize } from '~/hooks/useTextareaAutosize'
import { useChatInputFocus } from '~/hooks/useChatInputFocus'
import { UserSettings } from '~/components/Chat/UserSettings'
import {
  selectBestModel,
  VisionCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import { type OpenAIModelID } from '~/utils/modelProviders/types/openai'
import type ChatUI from '~/utils/modelProviders/WebLLM'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { useRouteChat } from '@/hooks/queries/useRouteChat'
import { type ChatBody, ContextWithMetadata } from '~/types/chat'
import { ALLOWED_FILE_EXTENSIONS, isImageFile } from '~/utils/fileUploadUtils'

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => Promise<void>
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

  const {
    fileUploads,
    fileUploadRef,
    handleFileSelection,
    removeFileUpload,
    clearFileUploads,
    hasProcessingFiles,
  } = useFileUpload({ courseName, user_id, selectedConversation, homeDispatch })

  const [content, setContent] = useState<string>(() => inputContent)

  const {
    showPromptList,
    filteredPrompts,
    activePromptIndex,
    setActivePromptIndex,
    promptListRef,
    handleInitModal,
    isModalVisible,
    closeModal,
    variables,
    handlePromptKeyDown,
    handlePromptSelect,
    onTextChange,
  } = usePromptAutocomplete({ prompts, content, setContent })
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [showPluginSelect, setShowPluginSelect] = useState(false)
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const chatInputContainerRef = useRef<HTMLDivElement>(null)
  const chatInputParentContainerRef = useRef<HTMLDivElement>(null)
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const modelSelectContainerRef = useRef<HTMLDivElement | null>(null)
  const { mutateAsync: routeChatAsync } = useRouteChat()
  const { resetHeight } = useTextareaAutosize({ textareaRef, content })
  const { isFocused, handleFocus, handleBlur } = useChatInputFocus({
    textareaRef,
    chatInputParentContainerRef,
    chatInputContainerRef,
    inputContent,
    setContent,
  })

  const handleTextClick = () => {
    homeDispatch({
      field: 'showModelSettings',
      value: !showModelSettings,
    })
  }

  const chatInputContainerStyle: CSSProperties = {
    paddingBottom: '0',
    paddingLeft: '10px',
  }

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
    onTextChange(value)
  }

  const handleSend = async () => {
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
      // BG: removable?
      const pendingFiles = fileUploads.filter((fu) => fu.status !== 'completed')

      if (pendingFiles.length > 0) {
        showWarningToast(
          'Please wait for all files to finish processing before sending',
          'Files Still Processing',
        )
        return
      }
      // END BG

      // Create file content for the message (files are already processed)
      fileContent = fileUploads
        .filter((fu) => fu.status === 'completed')
        .map((fu) => {
          if (isImageFile(fu.file)) {
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

    // Clear the composer immediately so the text disappears
    setContent('')
    setInputContent('')
    resetHeight()

    // Send the message
    onSend(messageForChat, plugin)

    // Reset states
    setPlugin(null)
    clearFileUploads()
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (handlePromptKeyDown(e)) return
    if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault()
      setShowPluginSelect(!showPluginSelect)
    }
  }

  const handleSubmit = async () => {
    if (messageIsStreaming) {
      return
    }

    const chatBody: ChatBody = {
      conversation: selectedConversation ?? undefined,
      course_name: courseName,
      stream: true,
      key: '',
      mode: 'chat',
    }

    try {
      await routeChatAsync(chatBody)
    } catch (error) {
      console.error('Error in chat submission:', error)
      showErrorToast(
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.',
      )
    }
  }

  const theme = useMantineTheme()

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
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={() => textareaRef.current?.focus()}
            style={{
              ...chatInputContainerStyle,
              pointerEvents: 'auto',
            }}
          >
            {fileUploads.length > 0 && (
              <FileUploadPreview
                fileUploads={fileUploads}
                onRemove={removeFileUpload}
              />
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
                aria-label="Upload files"
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
                tabIndex={0}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center justify-center rounded-full bg-[white/30] p-2 opacity-50 hover:opacity-100"
                onClick={handleSend}
                style={{ pointerEvents: 'auto' }}
                type="button"
                aria-label="Send message"
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
                  tabIndex={0}
                  aria-label="Scroll Down"
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
                  onClose={closeModal}
                />
              </div>
            )}
          </div>

          <Text
            role="button"
            tabIndex={0}
            aria-label="Chat Settings"
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
