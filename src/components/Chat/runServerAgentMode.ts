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
import { saveConversationToLocalStorage } from '~/hooks/__internal__/conversation'
import { type UseAgentStreamCallbacks } from '~/hooks/useAgentStream'
import { type HomeInitialState } from '~/pages/api/home/home.state'
import { type AgentRunRequest } from '~/types/agentStream'

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
  let assistantContent = ''
  let assistantMessageId: string | null = null
  let runFinished = false
  let runAborted = false
  let stopWatcher: ReturnType<typeof setInterval> | null = null
  let abortFinalized = false

  const agentMessageIndex =
    updatedConversation.messages.length > 0
      ? updatedConversation.messages.length - 1
      : -1

  const syncConversationList = () => {
    if (!conversations || conversations.length === 0) {
      return
    }

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

  const writeToLocalStorage = () => {
    saveConversationToLocalStorage(updatedConversation, {
      allowEmptyMessages: true,
      logContext: 'runServerAgentMode',
    })
  }

  const touchConversationTimestamps = (
    conversation: Conversation,
  ): Conversation => {
    const now = new Date().toISOString()
    return {
      ...conversation,
      createdAt: conversation.createdAt ?? now,
      updatedAt: now,
    }
  }

  const syncAgentMessage = ({
    syncList = true,
    persist = false,
  }: {
    syncList?: boolean
    persist?: boolean
  } = {}) => {
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
    updatedConversation = touchConversationTimestamps(updatedConversation)

    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    })

    if (syncList) {
      syncConversationList()
    }

    if (persist) {
      writeToLocalStorage()
    }
  }

  const finishRun = ({
    persist = false,
    invalidateHistory = false,
  }: {
    persist?: boolean
    invalidateHistory?: boolean
  } = {}) => {
    homeDispatch({ field: 'loading', value: false })
    homeDispatch({
      field: 'messageIsStreaming',
      value: false,
    })
    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    })
    homeDispatch({ field: 'isRouting', value: false })
    homeDispatch({ field: 'isRunningTool', value: false })
    homeDispatch({
      field: 'isRetrievalLoading',
      value: false,
    })

    syncConversationList()

    if (persist) {
      writeToLocalStorage()
    }

    if (invalidateHistory) {
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', courseName],
      })
    }
  }

  const agentRequest: AgentRunRequest = {
    conversationId: updatedConversation.id,
    courseName,
    userEmail: selectedConversation.userEmail,
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
    updatedConversation = touchConversationTimestamps(updatedConversation)
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
    updatedConversation = touchConversationTimestamps(updatedConversation)

    syncAgentMessage({ syncList: true })
  }

  const finalizeAbort = () => {
    if (abortFinalized) {
      return
    }

    abortFinalized = true
    const now = new Date().toISOString()
    const agentEvents = message.agentEvents ?? []

    if (agentEvents.length > 0) {
      message.agentEvents = agentEvents.map((event) => {
        if (event.status !== 'running' && event.status !== 'pending') {
          return event
        }

        return {
          ...event,
          status: 'error',
          updatedAt: now,
          metadata: {
            ...event.metadata,
            errorMessage: event.metadata?.errorMessage ?? 'Stopped',
          },
        }
      })
      syncAgentMessage({ persist: true })
    } else {
      updatedConversation = touchConversationTimestamps(updatedConversation)
    }

    finishRun({ persist: true })
  }

  try {
    message.agentEvents = []
    syncAgentMessage({ persist: true })

    posthog.capture('agent_mode_server_run', {
      course_name: courseName,
      model_id: selectedConversation.model.id,
    })

    stopWatcher = setInterval(() => {
      if (!stopConversationRef.current || runFinished || runAborted) {
        return
      }

      runAborted = true
      abortAgent()
    }, 50)

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
          syncAgentMessage({ persist: true })
        },

        onAgentEventsUpdate: (agentEvents) => {
          message.agentEvents = agentEvents
          syncAgentMessage({ persist: true })
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

        onDone: (_conversationId, finalMessageId, _summary) => {
          runFinished = true

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

          finishRun({
            persist: true,
            invalidateHistory: true,
          })
        },

        onError: (errorMessage) => {
          runFinished = true

          if (runAborted || /aborted/i.test(errorMessage)) {
            finalizeAbort()
            return
          }

          console.error('[Agent Mode] Server-side agent error:', errorMessage)
          finishRun({ persist: true })
          errorToast({
            title: 'Agent Error',
            message: errorMessage,
          })
        },
      },
    })

    if (runAborted && !runFinished) {
      runFinished = true
      finalizeAbort()
    }
  } catch (error) {
    if (runAborted || (error instanceof Error && error.name === 'AbortError')) {
      if (!runFinished) {
        runFinished = true
        finalizeAbort()
      }
      return
    }

    console.error('[Agent Mode] Error running server-side agent:', error)
    runFinished = true
    finishRun({ persist: true })
    errorToast({
      title: 'Agent Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    if (stopWatcher) {
      clearInterval(stopWatcher)
    }

    homeDispatch({ field: 'isRouting', value: false })
    homeDispatch({ field: 'isRunningTool', value: false })
    homeDispatch({ field: 'isRetrievalLoading', value: false })
  }
}
