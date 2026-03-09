import { type QueryClient } from '@tanstack/react-query'
import posthog from 'posthog-js'
import { type Dispatch, type MutableRefObject } from 'react'

import { type ActionType } from '@/hooks/useCreateReducer'
import {
  type AgentEvent,
  type Conversation,
  type Message,
  type UIUCTool,
} from '@/types/chat'
import { type UseAgentStreamCallbacks } from '~/hooks/useAgentStream'
import { type HomeInitialState } from '~/pages/api/home/home.state'
import { type AgentRunRequest } from '~/types/agentStream'
import { toClientConversation } from '~/types/clientConversation'

type HomeDispatch = Dispatch<ActionType<HomeInitialState>>

interface ToastArgs {
  title: string
  message: string
}

interface RunServerAgentModeParams {
  abortAgent: () => void
  conversations: Conversation[] | undefined
  courseName: string
  enabledDocumentGroups: string[]
  errorToast: (args: ToastArgs) => void
  homeDispatch: HomeDispatch
  message: Message
  queryClient: QueryClient
  runAgentAsync: (variables: {
    request: AgentRunRequest
    callbacks: UseAgentStreamCallbacks
  }) => Promise<void>
  selectedConversation: Conversation
  stopConversationRef: MutableRefObject<boolean>
  updatedConversation: Conversation
}

export async function runServerAgentMode({
  abortAgent,
  conversations,
  courseName,
  enabledDocumentGroups,
  errorToast,
  homeDispatch,
  message,
  queryClient,
  runAgentAsync,
  selectedConversation,
  stopConversationRef,
  updatedConversation: initialConversation,
}: RunServerAgentModeParams): Promise<void> {
  let updatedConversation = initialConversation

  const agentMessageIndex =
    updatedConversation.messages.length > 0
      ? updatedConversation.messages.length - 1
      : -1

  const syncAgentMessage = () => {
    if (
      agentMessageIndex < 0 ||
      agentMessageIndex >= updatedConversation.messages.length
    ) {
      return
    }

    const updatedMessages = [...updatedConversation.messages]
    updatedMessages[agentMessageIndex] = { ...message }

    updatedConversation = {
      ...updatedConversation,
      messages: updatedMessages,
      agentModeEnabled: true,
    }

    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    })

    if (conversations && conversations.length > 0) {
      const exists = conversations.some((conversation) => {
        return conversation.id === updatedConversation.id
      })
      const updatedConversationList = exists
        ? conversations.map((conversation) => {
            return conversation.id === updatedConversation.id
              ? updatedConversation
              : conversation
          })
        : [updatedConversation, ...conversations]

      homeDispatch({
        field: 'conversations',
        value: updatedConversationList,
      })
    }
  }

  const agentRequest: AgentRunRequest = {
    conversationId: updatedConversation.id,
    courseName,
    userMessage: {
      id: message.id,
      content: message.content,
      imageUrls: message.imageUrls,
    },
    documentGroups: enabledDocumentGroups,
    model: {
      id: selectedConversation.model.id,
      name: selectedConversation.model.name,
    },
    temperature: selectedConversation.temperature,
    systemPrompt: selectedConversation.prompt,
    fileUploadContexts: message.contexts?.map((context, index) => ({
      id: context.id ?? index,
      text: context.text,
      readable_filename: context.readable_filename,
      s3_path: context.s3_path,
      url: context.url,
    })),
  }

  let assistantContent = ''
  let assistantMessageId: string | null = null

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(
        'selectedConversation',
        JSON.stringify(toClientConversation(updatedConversation)),
      )
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        console.warn(
          '[Agent Mode] localStorage quota exceeded, saving minimal data',
        )
        localStorage.setItem(
          'selectedConversation',
          JSON.stringify({
            id: updatedConversation.id,
            name: updatedConversation.name,
            model: updatedConversation.model,
            agentModeEnabled: true,
          }),
        )
      }
    }
  }

  const ensureAssistantMessageExists = () => {
    if (!assistantMessageId) {
      return
    }

    const existingIndex = updatedConversation.messages.findIndex((item) => {
      return item.id === assistantMessageId
    })
    if (existingIndex >= 0) {
      return
    }

    updatedConversation = {
      ...updatedConversation,
      messages: [
        ...updatedConversation.messages,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        },
      ],
    }
  }

  const updateAssistantMessage = (content: string) => {
    if (!assistantMessageId) {
      return
    }

    ensureAssistantMessageExists()

    const assistantIndex = updatedConversation.messages.findIndex((item) => {
      return item.id === assistantMessageId
    })
    if (assistantIndex < 0) {
      return
    }

    const updatedMessages = [...updatedConversation.messages]
    const assistantMessage = updatedMessages[assistantIndex]
    if (!assistantMessage) {
      return
    }

    updatedMessages[assistantIndex] = {
      ...assistantMessage,
      content,
    }
    updatedConversation = {
      ...updatedConversation,
      messages: updatedMessages,
    }

    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    })
  }

  try {
    message.agentEvents = []
    syncAgentMessage()

    posthog.capture('agent_mode_server_run', {
      course_name: courseName,
      model_id: selectedConversation.model.id,
    })

    const stopWatcher = setInterval(() => {
      if (stopConversationRef.current) {
        abortAgent()
      }
    }, 50)

    try {
      await runAgentAsync({
        request: agentRequest,
        callbacks: {
          onInitializing: (
            _messageId,
            _conversationId,
            nextAssistantMessageId,
          ) => {
            assistantMessageId = nextAssistantMessageId

            const initEvent: AgentEvent = {
              id: 'agent-initializing',
              stepNumber: 0,
              type: 'initializing',
              status: 'running',
              title: 'Initializing agent...',
              createdAt: new Date().toISOString(),
            }
            message.agentEvents = [initEvent]
            syncAgentMessage()
            homeDispatch({
              field: 'selectedConversation',
              value: updatedConversation,
            })
          },

          onAgentEventsUpdate: (agentEvents) => {
            message.agentEvents = agentEvents
            syncAgentMessage()
            saveToLocalStorage()
          },

          onToolsUpdate: (clientTools) => {
            message.tools = clientTools.map((tool): UIUCTool => {
              return {
                id: tool.id,
                invocationId: tool.invocationId,
                name: tool.name,
                readableName: tool.readableName,
                description: tool.description,
                aiGeneratedArgumentValues: tool.aiGeneratedArgumentValues,
                output: tool.output
                  ? {
                      text: tool.output.text,
                      imageUrls: tool.output.imageUrls,
                    }
                  : undefined,
                error: tool.error,
              }
            })
            syncAgentMessage()
          },

          onContextsMetadata: (_messageId, contextsMetadata) => {
            message.contexts = contextsMetadata.map((metadata, index) => {
              return {
                id: index,
                text: '',
                readable_filename: metadata.readable_filename,
                course_name: courseName,
                'course_name ': courseName,
                s3_path: metadata.s3_path,
                pagenumber: String(metadata.pagenumber || ''),
                url: metadata.url || '',
                base_url: metadata.base_url || '',
              }
            })
            syncAgentMessage()
          },

          onRetrievalStart: () => {
            homeDispatch({ field: 'isRetrievalLoading', value: true })
          },

          onRetrievalDone: () => {
            homeDispatch({ field: 'isRetrievalLoading', value: false })
          },

          onToolStart: () => {
            homeDispatch({ field: 'isRunningTool', value: true })
          },

          onToolDone: () => {
            homeDispatch({ field: 'isRunningTool', value: false })
          },

          onFinalTokens: (delta, done) => {
            if (done) {
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({
                field: 'messageIsStreaming',
                value: false,
              })
              return
            }

            homeDispatch({ field: 'loading', value: false })
            assistantContent += delta
            updateAssistantMessage(assistantContent)
          },

          onDone: (conversationId, finalMessageId, summary) => {
            if (assistantMessageId && assistantMessageId !== finalMessageId) {
              const assistantIndex = updatedConversation.messages.findIndex(
                (item) => {
                  return item.id === assistantMessageId
                },
              )
              if (assistantIndex >= 0) {
                const updatedMessages = [...updatedConversation.messages]
                const assistantMessage = updatedMessages[assistantIndex]
                if (!assistantMessage) {
                  return
                }

                updatedMessages[assistantIndex] = {
                  ...assistantMessage,
                  id: finalMessageId,
                }
                updatedConversation = {
                  ...updatedConversation,
                  messages: updatedMessages,
                }
              }
              assistantMessageId = finalMessageId
            }

            console.log('[Agent Mode] Server-side agent completed', {
              conversationId,
              finalMessageId,
              totalContextsRetrieved: summary.totalContextsRetrieved,
              toolsExecuted: summary.toolsExecuted.length,
            })

            homeDispatch({ field: 'loading', value: false })
            homeDispatch({
              field: 'messageIsStreaming',
              value: false,
            })
            homeDispatch({ field: 'isRouting', value: false })
            homeDispatch({ field: 'isRunningTool', value: false })
            homeDispatch({
              field: 'isRetrievalLoading',
              value: false,
            })

            saveToLocalStorage()
            queryClient.invalidateQueries({
              queryKey: ['conversationHistory', courseName],
            })
          },

          onError: (errorMessage) => {
            console.error('[Agent Mode] Server-side agent error:', errorMessage)

            homeDispatch({ field: 'loading', value: false })
            homeDispatch({
              field: 'messageIsStreaming',
              value: false,
            })
            homeDispatch({ field: 'isRouting', value: false })
            homeDispatch({ field: 'isRunningTool', value: false })
            homeDispatch({
              field: 'isRetrievalLoading',
              value: false,
            })

            errorToast({
              title: 'Agent Error',
              message: errorMessage,
            })
          },
        },
      })
    } finally {
      clearInterval(stopWatcher)
    }
  } catch (error) {
    console.error('[Agent Mode] Error running server-side agent:', error)
    homeDispatch({ field: 'loading', value: false })
    homeDispatch({ field: 'messageIsStreaming', value: false })

    errorToast({
      title: 'Agent Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    homeDispatch({ field: 'isRouting', value: false })
    homeDispatch({ field: 'isRunningTool', value: false })
    homeDispatch({ field: 'isRetrievalLoading', value: false })
  }
}
