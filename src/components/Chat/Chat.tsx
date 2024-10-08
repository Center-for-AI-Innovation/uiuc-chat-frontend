// src/components/Chat/Chat.tsx
import { IconArrowRight, IconAlertCircle } from '@tabler/icons-react'
import {
  type MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button, Text } from '@mantine/core'
import { useTranslation } from 'next-i18next'

import { saveConversations } from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'
import { v4 as uuidv4 } from 'uuid'
import {
  type ChatBody,
  type Conversation,
  type Message,
  Content,
  UIUCTool,
} from '@/types/chat'
import { type Plugin } from '@/types/plugin'

import HomeContext from '~/pages/api/home/home.context'

import { ChatInput } from './ChatInput'
import { ChatLoader } from './ChatLoader'
import { ErrorMessageDiv } from './ErrorMessageDiv'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { fetchPresignedUrl } from '~/utils/apiUtils'

import { type CourseMetadata } from '~/types/courseMetadata'

interface Props {
  stopConversationRef: MutableRefObject<boolean>
  courseMetadata: CourseMetadata
  courseName: string
  currentEmail: string
}

import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'
import ChatNavbar from '../UIUC-Components/navbars/ChatNavbar'
// import { MainPageBackground } from '../UIUC-Components/MainPageBackground'
import { notifications } from '@mantine/notifications'
import { Montserrat } from 'next/font/google'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import {
  State,
  constructChatBody,
  getOpenAIKey,
  handleContextSearch,
  processChunkWithStateMachine,
  routeModelRequest,
} from '~/utils/streamProcessing'
import {
  handleFunctionCall,
  handleToolCall,
  useFetchAllWorkflows,
} from '~/utils/functionCalling/handleFunctionCalling'
import { useFetchEnabledDocGroups } from '~/hooks/docGroupsQueries'
import { CropwizardLicenseDisclaimer } from '~/pages/cropwizard-licenses'
import Head from 'next/head'
import ChatUI, { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { MLCEngine } from '@mlc-ai/web-llm'
import * as webllm from '@mlc-ai/web-llm'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { handleImageContent } from '~/utils/streamProcessing'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateConversation } from '~/hooks/conversationQueries'
import { motion } from 'framer-motion'
import { useDeleteMessages } from '~/hooks/messageQueries'
import { AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

const DEFAULT_DOCUMENT_GROUP = {
  id: 'DocGroup-all',
  name: 'All Documents', // This value can be stored in an env variable
  checked: true,
}
export const modelCached: WebllmModel[] = []
export const Chat = memo(
  ({
    stopConversationRef,
    courseMetadata,
    courseName,
    currentEmail,
  }: Props) => {
    const { t } = useTranslation('chat')
    const clerk_obj = useUser()
    const router = useRouter()
    const queryClient = useQueryClient()
    // const
    const [bannerUrl, setBannerUrl] = useState<string | null>(null)
    const getCurrentPageName = () => {
      // /CS-125/materials --> CS-125
      return router.asPath.slice(1).split('/')[0] as string
    }
    const user_email = extractEmailsFromClerk(clerk_obj.user)[0]
    // const [user_email, setUserEmail] = useState<string | undefined>(undefined)

    // const updateConversationMutation = useUpdateConversation(
    //   user_email as string,
    //   queryClient,
    // )
    const [chat_ui] = useState(new ChatUI(new MLCEngine()))

    const [inputContent, setInputContent] = useState<string>('')

    const [enabledDocumentGroups, setEnabledDocumentGroups] = useState<
      string[]
    >([])
    const [enabledTools, setEnabledTools] = useState<string[]>([])

    const {
      data: documentGroupsHook,
      isSuccess: isSuccessDocumentGroups,
      // isError: isErrorDocumentGroups,
    } = useFetchEnabledDocGroups(getCurrentPageName())

    const {
      data: toolsHook,
      isSuccess: isSuccessTools,
      isLoading: isLoadingTools,
      isError: isErrorTools,
      error: toolLoadingError,
      // refetch: refetchTools,
    } = useFetchAllWorkflows(getCurrentPageName())

    useEffect(() => {
      if (
        courseMetadata?.banner_image_s3 &&
        courseMetadata.banner_image_s3 !== ''
      ) {
        fetchPresignedUrl(courseMetadata.banner_image_s3).then((url) => {
          setBannerUrl(url)
        })
      }
    }, [courseMetadata])

    const {
      state: {
        selectedConversation,
        conversations,
        apiKey,
        pluginKeys,
        serverSideApiKeyIsSet,
        messageIsStreaming,
        modelError,
        loading,
        prompts,
        showModelSettings,
        isImg2TextLoading,
        isRouting,
        isRunningTool, // TODO change to isFunctionCallLoading
        isRetrievalLoading,
        documentGroups,
        tools,
        webLLMModelIdLoading,
        llmProviders,
      },
      handleUpdateConversation,
      dispatch: homeDispatch,
    } = useContext(HomeContext)

    useEffect(() => {
      const loadModel = async () => {
        if (selectedConversation?.model && !chat_ui.isModelLoading()) {
          homeDispatch({
            field: 'webLLMModelIdLoading',
            value: { id: selectedConversation.model.id, isLoading: true },
          })
          await chat_ui.loadModel(selectedConversation)
          if (!chat_ui.isModelLoading()) {
            console.log('Model has finished loading')
            homeDispatch({
              field: 'webLLMModelIdLoading',
              value: { id: selectedConversation.model.id, isLoading: false },
            })
          }
        }
      }
      if (
        selectedConversation?.model &&
        webLLMModels.some((m) => m.name === selectedConversation.model.name)
      ) {
        loadModel()
      }
    }, [selectedConversation?.model?.id, chat_ui])

    const [currentMessage, setCurrentMessage] = useState<Message>()
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
    // const [showSettings, setShowSettings] = useState<boolean>(false)
    const [showScrollDownButton, setShowScrollDownButton] =
      useState<boolean>(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    // const createConversationMutation = useCreateConversation(queryClient)
    const updateConversationMutation = useUpdateConversation(
      currentEmail,
      queryClient,
      courseName,
    )

    const deleteMessagesMutation = useDeleteMessages(
      currentEmail,
      queryClient,
      courseName,
    )

    // Document Groups
    useEffect(() => {
      if (isSuccessDocumentGroups) {
        const documentGroupActions = [
          DEFAULT_DOCUMENT_GROUP,
          ...(documentGroupsHook?.map((docGroup, index) => ({
            id: `DocGroup-${index}`,
            name: docGroup.name,
            checked: false,
            onTrigger: () => console.log(`${docGroup.name} triggered`),
          })) || []),
        ]

        homeDispatch({
          field: 'documentGroups',
          value: [...documentGroupActions],
        })
      }
    }, [documentGroupsHook, isSuccessDocumentGroups])

    useEffect(() => {
      setEnabledDocumentGroups(
        documentGroups
          .filter((action) => action.checked)
          .map((action) => action.name),
      )
    }, [documentGroups])

    // TOOLS
    useEffect(() => {
      if (isSuccessTools) {
        homeDispatch({
          field: 'tools',
          value: [...toolsHook],
        })
      } else if (isErrorTools) {
        errorToast({
          title: 'Error loading tools',
          message:
            (toolLoadingError as Error).message +
            '.\nPlease refresh the page or try again later. Regular chat features may still work.',
        })
      }
    }, [toolsHook, isSuccessTools])

    useEffect(() => {
      setEnabledTools(
        tools.filter((action) => action.enabled).map((action) => action.name),
      )
    }, [tools])

    const onMessageReceived = async (conversation: Conversation) => {
      // Log conversation to Supabase
      try {
        const response = await fetch(
          `/api/UIUC-api/logConversationToSupabase`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course_name: getCurrentPageName(),
              conversation: conversation,
            }),
          },
        )
        const data = await response.json()
        // return data.success
      } catch (error) {
        console.error('Error setting course data:', error)
        // return false
      }

      try {
        // Log conversation to our Flask Backend (especially Nomic)
        const response = await fetch(
          `https://flask-production-751b.up.railway.app/onResponseCompletion`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course_name: getCurrentPageName(),
              conversation: conversation,
            }),
          },
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message)
        return data.success
      } catch (error) {
        console.error(
          'Error in chat.tsx running onResponseCompletion():',
          error,
        )
        return false
      }
    }

    const resetMessageStates = () => {
      homeDispatch({ field: 'isRouting', value: undefined })
      homeDispatch({ field: 'isRunningTool', value: undefined })
      homeDispatch({ field: 'isImg2TextLoading', value: undefined })
      homeDispatch({ field: 'isRetrievalLoading', value: undefined })
    }

    // THIS IS WHERE MESSAGES ARE SENT.
    const handleSend = useCallback(
      async (
        message: Message,
        deleteCount = 0,
        plugin: Plugin | null = null,
        tools: UIUCTool[],
        enabledDocumentGroups: string[],
        llmProviders: AllLLMProviders,
      ) => {
        console.log('handleSend called with model:', selectedConversation?.model);
        setCurrentMessage(message)
        resetMessageStates()

        let searchQuery = Array.isArray(message.content)
          ? message.content.map((content) => content.text).join(' ')
          : message.content

        if (selectedConversation) {
          // Add this type guard function
          function isValidModel(model: any): model is { id: string; name: string } {
            return model && typeof model.id === 'string' && typeof model.name === 'string';
          }

          // Check if model is defined and valid
          if (!isValidModel(selectedConversation.model)) {
            console.error('Selected conversation does not have a valid model.');
            errorToast({
              title: 'Model Error',
              message: 'No valid model selected for the conversation.',
            });
            return;
          }

          let updatedConversation: Conversation
          if (deleteCount) {
            // Remove tools from message to clear old tools
            message.tools = []
            message.contexts = []
            message.content = Array.isArray(message.content)
              ? message.content.filter(
                  (content) => content.type !== 'tool_image_url',
                )
              : message.content

            const updatedMessages = [...(selectedConversation.messages || [])]
            const messagesToDelete = updatedMessages.slice(0, deleteCount)
            for (let i = 0; i < deleteCount; i++) {
              updatedMessages.pop()
            }
            updatedConversation = {
              ...selectedConversation,
              messages: [...updatedMessages, message],
            }
            await deleteMessagesMutation.mutate({
              convoId: selectedConversation.id,
              deletedMessages: messagesToDelete,
            })
          } else {
            updatedConversation = {
              ...selectedConversation,
              messages: [...(selectedConversation.messages || []), message],
            }
            // console.log(
            //   'updatedConversation before name:',
            //   updatedConversation,
            //   updatedConversation.messages?.length,
            // )
            // Update the name of the conversation if it's the first message
            if (updatedConversation.messages?.length === 1) {
              const { content } = message
              // Use only texts instead of content itself
              const contentText = Array.isArray(content)
                ? content.map((content) => content.text).join(' ')
                : content

              // This is where we can customize the name of the conversation
              const customName =
                contentText.length > 30
                  ? contentText.substring(0, 30) + '...'
                  : contentText

              updatedConversation = {
                ...updatedConversation,
                name: customName,
              }
              // console.log(
              //   'updatedConversation after name:',
              //   updatedConversation,
              // )
            }
          }
          // homeDispatch({
          //   field: 'selectedConversation',
          //   value: updatedConversation,
          // })
          // Update the conversation in the server
          // if (!user_email) {
          // saveConversationToLocalStorage(updatedConversation)
          // } else {

          // console.log(
          //   'updatedConversation before mutation:',
          //   updatedConversation,
          // )
          handleUpdateConversation(updatedConversation, {
            key: 'messages',
            value: updatedConversation.messages,
          })
          updateConversationMutation.mutate(updatedConversation)
          console.log(
            'updatedConversation after mutation:',
            updatedConversation,
          )
          homeDispatch({ field: 'loading', value: true })
          homeDispatch({ field: 'messageIsStreaming', value: true })
          const controller = new AbortController()

          // const courseName = getCurrentPageName()

          let imgDesc = ''
          let imageUrls: string[] = []

          // Action 1: Image to Text Conversion
          if (Array.isArray(message.content)) {
            const imageContent = (message.content as Content[]).filter(
              (content) => content.type === 'image_url',
            )

            if (imageContent.length > 0) {
              homeDispatch({ field: 'isImg2TextLoading', value: true })
              try {
                const { searchQuery: newSearchQuery, imgDesc: newImgDesc } =
                  await handleImageContent(
                    message,
                    courseName,
                    updatedConversation,
                    searchQuery,
                    llmProviders,
                    controller,
                  )
                searchQuery = newSearchQuery
                imgDesc = newImgDesc
                imageUrls = imageContent.map(
                  (content) => content.image_url?.url as string,
                )
              } catch (error) {
                console.error(
                  'Error in chat.tsx running handleImageContent():',
                  error,
                )
              } finally {
                homeDispatch({ field: 'isImg2TextLoading', value: false })
              }
            }
          }

          // Action 2: Context Retrieval: Vector Search
          homeDispatch({ field: 'isRetrievalLoading', value: true })
          await handleContextSearch(
            message,
            courseName,
            selectedConversation,
            searchQuery,
            enabledDocumentGroups,
          )
          homeDispatch({ field: 'isRetrievalLoading', value: false })

          // Action 3: Tool Execution
          if (tools.length > 0) {
            try {
              homeDispatch({ field: 'isRouting', value: true })
              // Check if any tools need to be run
              const uiucToolsToRun = await handleFunctionCall(
                message,
                tools,
                imageUrls,
                imgDesc,
                updatedConversation,
                getOpenAIKey(courseMetadata, apiKey),
              )
              homeDispatch({ field: 'isRouting', value: false })
              if (uiucToolsToRun.length > 0) {
                homeDispatch({ field: 'isRunningTool', value: true })
                // Run the tools
                await handleToolCall(
                  uiucToolsToRun,
                  updatedConversation,
                  courseName,
                )
              }

              homeDispatch({ field: 'isRunningTool', value: false })
            } catch (error) {
              console.error(
                'Error in chat.tsx running handleFunctionCall():',
                error,
              )
            } finally {
              homeDispatch({ field: 'isRunningTool', value: false })
            }
          }

          const chatBody: ChatBody = constructChatBody(
            updatedConversation,
            getOpenAIKey(courseMetadata, apiKey),
            courseName,
            true,
            courseMetadata,
            llmProviders,
          )
          // Action 4: Build Prompt - Put everything together into a prompt
          const buildPromptResponse = await fetch('/api/buildPrompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatBody),
          })

          const builtConversation = await buildPromptResponse.json()
          chatBody.conversation = builtConversation

          // Ensure that chatBody.model is set
          if (!chatBody.model) {
            chatBody.model = selectedConversation.model
          }

          updatedConversation = chatBody.conversation!

          // Update the selected conversation
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          })

          // Action 5: Run Chat Completion based on model provider
          let response:
            | AsyncIterable<webllm.ChatCompletionChunk>
            | Response
            | undefined
          let reader

          if (
            selectedConversation.model &&
            webLLMModels.some(
              (model) => model.name === selectedConversation.model.name,
            )
          ) {
            // Is WebLLM model
            while (chat_ui.isModelLoading() == true) {
              await new Promise((resolve) => setTimeout(resolve, 10))
            }
            try {
              response = await chat_ui.runChatCompletion(
                selectedConversation,
                getCurrentPageName(),
              )
            } catch (error) {
              errorToast({
                title: 'Error running chat completion',
                message:
                  (error as Error).message || 'An unexpected error occurred',
              })
            }
          } else {
            try {
              // Route to the specific model provider
              response = await routeModelRequest(chatBody, controller)
            } catch (error) {
              console.error('Error routing to model provider:', error)
              errorToast({
                title: 'Error routing to model provider',
                message:
                  (error as Error).message || 'An unexpected error occurred',
              })
            }
          }

          if (response instanceof Response && !response.ok) {
            const final_response = await response.json()
            homeDispatch({ field: 'loading', value: false })
            homeDispatch({ field: 'messageIsStreaming', value: false })
            console.error(
              'Error calling the LLM:',
              final_response,
              final_response,
            )
            if (final_response.error) {
              let errorObj
              if (typeof final_response.error === 'string') {
                try {
                  errorObj = JSON.parse(final_response.error)
                } catch (e) {
                  errorObj = { error: final_response.error }
                }
              } else {
                errorObj = final_response.error
              }

              const errorDetails = errorObj.error || errorObj
              errorToast({
                title: errorDetails.type || 'Error',
                message: errorDetails.message || 'An unexpected error occurred',
              })
              return
            } else {
              errorToast({
                title: final_response.name,
                message:
                  final_response.message ||
                  'There was an unexpected error calling the LLM. Try using a different model (via the Settings button in the header).',
              })
            }
            return
          }

          let data
          if (response instanceof Response) {
            data = response.body
            if (!data) {
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
              return
            }
            reader = data.getReader()
          }

          if (!plugin) {
            homeDispatch({ field: 'loading', value: false })

            const decoder = new TextDecoder()
            let done = false
            let isFirst = true
            let text = ''
            let chunkValue
            let finalAssistantRespose = ''
            const citationLinkCache = new Map<number, string>()
            const stateMachineContext = { state: State.Normal, buffer: '' }
            try {
              // Action 6: Stream the LLM response, based on model provider.
              while (!done) {
                if (stopConversationRef.current === true) {
                  controller.abort()
                  done = true
                  break
                }
                if (response && 'next' in response) {
                  // Run WebLLM models
                  const iterator = (
                    response as AsyncIterable<webllm.ChatCompletionChunk>
                  )[Symbol.asyncIterator]()
                  const result = await iterator.next()
                  done = result.done ?? false
                  if (
                    done ||
                    result.value == undefined ||
                    result.value.choices[0]?.delta.content == undefined
                  ) {
                    // exit early
                    continue
                  }
                  chunkValue = result.value.choices[0]?.delta.content
                  text += chunkValue
                } else {
                  // OpenAI models & Vercel AI SDK models
                  const { value, done: doneReading } = await reader!.read()
                  done = doneReading
                  chunkValue = decoder.decode(value)
                  text += chunkValue
                }

                if (isFirst) {
                  // isFirst refers to the first chunk of data received from the API (happens once for each new message from API)
                  isFirst = false
                  const updatedMessages: Message[] = [
                    ...updatedConversation.messages,
                    {
                      id: uuidv4(),
                      role: 'assistant',
                      content: chunkValue,
                    },
                  ]
                  finalAssistantRespose += chunkValue
                  updatedConversation = {
                    ...updatedConversation,
                    messages: updatedMessages,
                  }
                  homeDispatch({
                    field: 'selectedConversation',
                    value: updatedConversation,
                  })
                } else {
                  if (updatedConversation.messages?.length > 0) {
                    const lastMessageIndex =
                      updatedConversation.messages?.length - 1
                    const lastMessage =
                      updatedConversation.messages[lastMessageIndex]
                    const lastUserMessage =
                      updatedConversation.messages[lastMessageIndex - 1]
                    if (
                      lastMessage &&
                      lastUserMessage &&
                      lastUserMessage.contexts
                    ) {
                      // Handle citations via state machine
                      finalAssistantRespose +=
                        await processChunkWithStateMachine(
                          chunkValue,
                          lastUserMessage,
                          stateMachineContext,
                          citationLinkCache,
                        )

                      // Update the last message with the new content
                      const updatedMessages = updatedConversation.messages?.map(
                        (msg, index) =>
                          index === lastMessageIndex
                            ? { ...msg, content: finalAssistantRespose }
                            : msg,
                      )

                      // Update the conversation with the new messages
                      updatedConversation = {
                        ...updatedConversation,
                        messages: updatedMessages,
                      }

                      // Dispatch the updated conversation
                      homeDispatch({
                        field: 'selectedConversation',
                        value: updatedConversation,
                      })
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error reading from stream:', error)
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
              return
            }

            if (!done) {
              throw new Error('LLM response stream ended before it was done.')
            }

            try {
              // This is after the response is done streaming
              // saveConversation(updatedConversation)
              console.debug(
                'updatedConversation after streaming:',
                updatedConversation,
              )
              handleUpdateConversation(updatedConversation, {
                key: 'messages',
                value: updatedConversation.messages,
              })
              updateConversationMutation.mutate(updatedConversation)
              console.debug(
                'updatedConversation after mutation:',
                updatedConversation,
              )

              onMessageReceived(updatedConversation) // kastan here, trying to save message AFTER done streaming. This only saves the user message...

              // } else {
              //   onMessageReceived(updatedConversation)
              // }

              // Save the conversation to the server

              // await saveConversationToServer(updatedConversation).catch(
              //   (error) => {
              //     console.error(
              //       'Error saving updated conversation to server:',
              //       error,
              //     )
              //   },
              // )

              // const updatedConversations: Conversation[] = conversations.map(
              //   (conversation) => {
              //     if (conversation.id === selectedConversation.id) {
              //       return updatedConversation
              //     }
              //     return conversation
              //   },
              // )
              // if (updatedConversations.length === 0) {
              //   updatedConversations.push(updatedConversation)
              // }
              // homeDispatch({
              //   field: 'conversations',
              //   value: updatedConversations,
              // })
              // console.log('updatedConversations: ', updatedConversations)
              // saveConversations(updatedConversations)
              homeDispatch({ field: 'messageIsStreaming', value: false })
            } catch (error) {
              console.error('An error occurred: ', error)
              controller.abort()
            }
          } else {
            if (response instanceof Response) {
              const { answer } = await response.json()
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                {
                  id: uuidv4(),
                  role: 'assistant',
                  content: answer,
                  contexts: message.contexts,
                },
              ]
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              })
              // This is after the response is done streaming for plugins

              // handleUpdateConversation(updatedConversation, {
              //   key: 'messages',
              //   value: updatedMessages,
              // })

              // await saveConversationToServer(updatedConversation).catch(
              //   (error) => {
              //     console.error(
              //       'Error saving updated conversation to server:',
              //       error,
              //     )
              //   },
              // )
              // Do we need this?
              // saveConversation(updatedConversation)
              const updatedConversations: Conversation[] = conversations.map(
                (conversation) => {
                  if (conversation.id === selectedConversation.id) {
                    return updatedConversation
                  }
                  return conversation
                },
              )
              if (updatedConversations.length === 0) {
                updatedConversations.push(updatedConversation)
              }
              homeDispatch({
                field: 'conversations',
                value: updatedConversations,
              })
              // saveConversations(updatedConversations)
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
            }
          }
        }
      },
      [
        apiKey,
        conversations,
        pluginKeys,
        selectedConversation,
        stopConversationRef,
        chat_ui,
      ],
    )

    const handleRegenerate = useCallback(() => {
      if (currentMessage && Array.isArray(currentMessage.content)) {
        // Find the index of the existing image description
        const imgDescIndex = (currentMessage.content as Content[]).findIndex(
          (content) =>
            content.type === 'text' &&
            (content.text as string).startsWith('Image description: '),
        )

        if (imgDescIndex !== -1) {
          // Remove the existing image description
          ;(currentMessage.content as Content[]).splice(imgDescIndex, 1)
        }
        if (
          selectedConversation?.messages[
            selectedConversation?.messages?.length - 1
          ]?.role === 'user'
        ) {
          // console.log('user')
          handleSend(
            currentMessage,
            1,
            null,
            tools,
            enabledDocumentGroups,
            llmProviders,
          )
        } else {
          // console.log('assistant')
          handleSend(
            currentMessage,
            2,
            null,
            tools,
            enabledDocumentGroups,
            llmProviders,
          )
        }
      }
    }, [currentMessage, handleSend])

    const scrollToBottom = useCallback(() => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        textareaRef.current?.focus()
      }
    }, [autoScrollEnabled])

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current
        const bottomTolerance = 30

        if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
          setAutoScrollEnabled(false)
          setShowScrollDownButton(true)
        }
        // else {
        //   setAutoScrollEnabled(true)
        //   setShowScrollDownButton(false)
        // }
      }
    }

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }

    const handleSettings = () => {
      homeDispatch({ field: 'showModelSettings', value: !showModelSettings })
    }

    const onClearAll = () => {
      if (
        confirm(t<string>('Are you sure you want to clear all messages?')) &&
        selectedConversation
      ) {
        // Clear all messages, not used
        handleUpdateConversation(selectedConversation, {
          key: 'messages',
          value: [],
        })
      }
    }

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true)
      }
    }
    const throttledScrollDown = throttle(scrollDown, 250)

    useEffect(() => {
      if (messageIsStreaming) throttledScrollDown()
      if (selectedConversation) {
        const messages = selectedConversation.messages
        if (messages?.length > 1) {
          if (messages[messages?.length - 1]?.role === 'assistant') {
            setCurrentMessage(messages[messages?.length - 2])
          } else {
            setCurrentMessage(messages[messages?.length - 1])
          }
        } else if (messages?.length === 1) {
          setCurrentMessage(messages[0])
        } else {
          setCurrentMessage(undefined)
        }
      }
    }, [selectedConversation, throttledScrollDown])

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry?.isIntersecting || false)
          if (entry?.isIntersecting) {
            textareaRef.current?.focus()
          }
        },
        {
          root: null,
          threshold: 0.5,
        },
      )
      const messagesEndElement = messagesEndRef.current
      if (messagesEndElement) {
        observer.observe(messagesEndElement)
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement)
        }
      }
    }, [messagesEndRef])

    const statements =
      courseMetadata?.example_questions &&
      courseMetadata.example_questions.length > 0
        ? courseMetadata.example_questions
        : [
            'Make a bullet point list of key takeaways from this project.',
            'What are the best practices for [Activity or Process] in [Context or Field]?',
            'Can you explain the concept of [Specific Concept] in simple terms?',
          ]

    // Add this function to create dividers with statements
    const renderIntroductoryStatements = () => {
      return (
        <div className="xs:mx-2 mt-4 max-w-3xl gap-3 px-4 last:mb-2 sm:mx-4 md:mx-auto lg:mx-auto ">
          <div className="backdrop-filter-[blur(10px)] rounded-lg border-2 border-[rgba(42,42,120,0.55)] bg-[rgba(42,42,64,0.4)] p-6">
            <Text
              className={`mb-2 text-lg text-white ${montserrat_heading.variable} font-montserratHeading`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {courseMetadata?.course_intro_message}
            </Text>

            <h4
              className={`text-md mb-2 text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
            >
              {getCurrentPageName() === 'cropwizard-1.5' && (
                <CropwizardLicenseDisclaimer />
              )}
              Start a conversation below or try the following examples
            </h4>
            <div className="mt-4 flex flex-col items-start space-y-2 overflow-hidden">
              {statements.map((statement, index) => (
                <div
                  key={index}
                  className="w-full rounded-lg border-b-2 border-[rgba(42,42,64,0.4)] hover:cursor-pointer hover:bg-[rgba(42,42,64,0.9)]"
                  onClick={() => setInputContent(statement)}
                >
                  <Button
                    variant="link"
                    className={`text-md h-auto p-2 font-bold leading-relaxed text-white hover:underline ${montserrat_paragraph.variable} font-montserratParagraph `}
                  >
                    <IconArrowRight size={25} className="mr-2 min-w-[40px]" />
                    <p className="whitespace-break-spaces">{statement}</p>
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div
            // This is critical to keep the scrolling proper. We need padding below the messages for the chat bar to sit.
            // className="h-[162px] bg-gradient-to-b from-[#1a1a2e] via-[#2A2A40] to-[#15162c]"
            // className="h-[162px] bg-gradient-to-t from-transparent to-[rgba(14,14,21,0.4)]"
            // className="h-[162px] bg-gradient-to-b dark:from-[#2e026d] dark:via-[#15162c] dark:to-[#15162c]"
            className="h-[162px]"
            ref={messagesEndRef}
          />
        </div>
      )
    }
    // Inside Chat function before the return statement
    const renderMessageContent = (message: Message) => {
      if (Array.isArray(message.content)) {
        return (
          <>
            {message.content.map((content, index) => {
              if (content.type === 'image_url' && content.image_url) {
                return (
                  <img
                    key={index}
                    src={content.image_url.url}
                    alt="Uploaded content"
                  />
                )
              }
              return <span key={index}>{content.text}</span>
            })}
          </>
        )
      }
      return <span>{message.content}</span>
    }

    const updateMessages = (updatedMessage: Message, messageIndex: number) => {
      return selectedConversation?.messages?.map((message, index) => {
        return index === messageIndex ? updatedMessage : message
      })
    }

    const updateConversations = (updatedConversation: Conversation) => {
      return conversations.map((conversation) =>
        conversation.id === selectedConversation?.id
          ? updatedConversation
          : conversation,
      )
    }

    const onImageUrlsUpdate = useCallback(
      (updatedMessage: Message, messageIndex: number) => {
        if (!selectedConversation) {
          throw new Error('No selected conversation found')
        }

        const updatedMessages = updateMessages(updatedMessage, messageIndex)
        if (!updatedMessages) {
          throw new Error('Failed to update messages')
        }

        const updatedConversation = {
          ...selectedConversation,
          messages: updatedMessages,
        }

        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        })

        const updatedConversations = updateConversations(updatedConversation)
        if (!updatedConversations) {
          throw new Error('Failed to update conversations')
        }

        homeDispatch({ field: 'conversations', value: updatedConversations })
        // saveConversations(updatedConversations)
      },
      [selectedConversation, conversations],
    )

    return (
      <>
        <Head>
          <title>{getCurrentPageName()} - UIUC.chat</title>
          <meta
            name="description"
            content="The AI teaching assistant built for students at UIUC."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="overflow-wrap relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-[#15162c]">
          <div className="justify-center" style={{ height: '40px' }}>
            <ChatNavbar bannerUrl={bannerUrl as string} isgpt4={true} />
          </div>
          <div className="mt-10 max-w-full flex-grow overflow-y-auto overflow-x-hidden">
            {modelError ? (
              <ErrorMessageDiv error={modelError} />
            ) : (
              <>
                <motion.div
                  key={selectedConversation?.id}
                  className="mt-4 max-h-full"
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {selectedConversation && selectedConversation.messages && selectedConversation.messages?.length === 0 ? (
                    <>
                      <div className="mt-16">
                        {renderIntroductoryStatements()}
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedConversation?.messages?.map((message, index) => (
                        <MemoizedChatMessage
                          key={index}
                          message={message}
                          contentRenderer={renderMessageContent}
                          messageIndex={index}
                          onEdit={(editedMessage) => {
                            handleSend(
                              editedMessage,
                              selectedConversation?.messages?.length - index,
                              null,
                              tools,
                              enabledDocumentGroups,
                              llmProviders,
                            )
                          }}
                          onImageUrlsUpdate={onImageUrlsUpdate}
                        />
                      ))}
                      {loading && <ChatLoader />}
                      <div
                        className="h-[162px] bg-gradient-to-t from-transparent to-[rgba(14,14,21,0.4)]"
                        ref={messagesEndRef}
                      />
                    </>
                  )}
                </motion.div>
                {/* <div className="w-full max-w-[calc(100% - var(--sidebar-width))] mx-auto flex justify-center"> */}
                <ChatInput
                  stopConversationRef={stopConversationRef}
                  textareaRef={textareaRef}
                  onSend={(message, plugin) => {
                    // setCurrentMessage(message)
                    handleSend(
                      message,
                      0,
                      plugin,
                      tools,
                      enabledDocumentGroups,
                      llmProviders,
                    )
                  }}
                  onScrollDownClick={handleScrollDown}
                  onRegenerate={handleRegenerate}
                  showScrollDownButton={showScrollDownButton}
                  inputContent={inputContent}
                  setInputContent={setInputContent}
                  courseName={getCurrentPageName()}
                  chat_ui={chat_ui}
                />
              </>
            )}
          </div>
        </div>
      </>
    )
    Chat.displayName = 'Chat'
  },
)

export function errorToast({
  title,
  message,
}: {
  title: string
  message: string
}) {
  notifications.show({
    id: 'error-notification-reused',
    withCloseButton: true,
    closeButtonProps: { color: 'red' },
    onClose: () => console.log('error unmounted'),
    onOpen: () => console.log('error mounted'),
    autoClose: 12000,
    title: (
      <Text size={'lg'} className={`${montserrat_med.className}`}>
        {title}
      </Text>
    ),
    message: (
      <Text className={`${montserrat_med.className} text-neutral-200`}>
        {message}
      </Text>
    ),
    color: 'red',
    radius: 'lg',
    icon: <IconAlertCircle />,
    className: 'my-notification-class',
    style: {
      backgroundColor: 'rgba(42,42,64,0.3)',
      backdropFilter: 'blur(10px)',
      borderLeft: '5px solid red',
    },
    withBorder: true,
    loading: false,
  })
}
