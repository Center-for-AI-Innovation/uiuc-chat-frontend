// @utils/app/conversation
import {
  type Conversation,
  type ConversationPage,
  type Message,
  type SaveConversationDelta,
  type ConversationMeta,
  type ContextWithMetadata,
} from '@/types/chat'
import { cleanConversationHistory } from '@/utils/app/clean'
import { createHeaders } from '~/utils/httpHeaders'

// Helper function to create headers with PostHog ID and user email
// removed local createHeaders; use shared from ~/utils/httpHeaders

export async function fetchConversationHistory(
  searchTerm: string,
  courseName: string,
  pageParam: number,
  userEmail?: string,
): Promise<ConversationPage> {
  let finalResponse: ConversationPage = {
    conversations: [],
    nextCursor: null,
  }
  try {
    const response = await fetch(
      `/api/conversation?searchTerm=${searchTerm}&courseName=${courseName}&pageParam=${pageParam}`,
      {
        method: 'GET',
        headers: createHeaders(userEmail),
      },
    )

    if (!response.ok) {
      throw new Error('Error fetching conversation history')
    }

    const { conversations, nextCursor } = await response.json()

    // // Clean the conversations and ensure they're properly structured
    const cleanedConversations = conversations.map((conversation: any) => {
      // Ensure messages are properly ordered by creation time
      if (conversation.messages) {
        conversation.messages.sort((a: any, b: any) => {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
      }
      return conversation
    })

    finalResponse = cleanConversationHistory(cleanedConversations)
    finalResponse.nextCursor = nextCursor

    // Sync with local storage
    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation && finalResponse?.conversations?.length > 0) {
      const parsed = JSON.parse(selectedConversation)
      const serverConversation = finalResponse.conversations.find(
        (c) => c.id === parsed.id,
      )
      if (serverConversation) {
        localStorage.setItem(
          'selectedConversation',
          JSON.stringify(serverConversation),
        )
      }
    }
  } catch (error) {
    console.error(
      'utils/app/conversation.ts - Error fetching conversation history:',
      error,
    )
  }
  return finalResponse
}

export async function fetchLastConversation(
  courseName: string,
  userEmail?: string,
): Promise<Conversation | null> {
  try {
    // Grab the first page; server already orders by updated_at DESC in your SQL,
    const res = await fetch(
      `/api/conversation?searchTerm=&courseName=${encodeURIComponent(courseName)}&pageParam=0`,
      {
        method: 'GET',
        headers: createHeaders(userEmail),
      },
    )

    if (!res.ok) throw new Error('Error fetching last conversation')

    const { conversations } = await res.json()

    if (!Array.isArray(conversations) || conversations.length === 0) {
      return null
    }

    // Pick the most recent conversation
    return conversations[0] ?? null
  } catch (err) {
    console.error('Error fetching last conversation:', err)
    return null
  }
}

export const deleteConversationFromServer = async (
  id: string,
  course_name: string,
  userEmail?: string,
) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: createHeaders(userEmail),
      body: JSON.stringify({ id, course_name }),
    })

    if (!response.ok) {
      throw new Error('Error deleting conversation')
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
  }
}

export const deleteAllConversationsFromServer = async (
  course_name: string,
  userEmail?: string,
) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: createHeaders(userEmail),
      body: JSON.stringify({ course_name }),
    })

    if (!response.ok) {
      throw new Error('Error deleting conversation')
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
  }
}

export const saveConversationToLocalStorage = (conversation: Conversation) => {
  let successful = false
  try {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage =
        conversation.messages[conversation.messages.length - 1]
      if (lastMessage && lastMessage.feedback) {
        const messagesWithFeedback = conversation.messages.map(
          (message, index) => {
            if (index === conversation.messages.length - 1) {
              return { ...message, feedback: lastMessage.feedback }
            }
            return message
          },
        )
        const conversationWithFeedback = {
          ...conversation,
          messages: messagesWithFeedback,
        }

        try {
          localStorage.setItem(
            'selectedConversation',
            JSON.stringify(conversationWithFeedback),
          )
        } catch (error) {
          // Handle localStorage quota exceeded error
          if (
            error instanceof DOMException &&
            (error.name === 'QuotaExceededError' ||
              error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
              error.code === 22 ||
              error.code === 1014)
          ) {
            console.warn(
              'localStorage quota exceeded in saveConversationToLocalStorage, saving minimal conversation data instead',
            )
            clearSingleOldestConversation()

            // Create a minimal version of the conversation with just essential data
            const minimalConversation = {
              id: conversationWithFeedback.id,
              name: conversationWithFeedback.name,
              model: conversationWithFeedback.model,
              temperature: conversationWithFeedback.temperature,
              folderId: conversationWithFeedback.folderId,
              userEmail: conversationWithFeedback.userEmail,
              projectName: conversationWithFeedback.projectName,
              createdAt: conversationWithFeedback.createdAt,
              updatedAt: conversationWithFeedback.updatedAt,
            }

            try {
              // Try to save the minimal version
              localStorage.setItem(
                'selectedConversation',
                JSON.stringify(minimalConversation),
              )
            } catch (minimalError) {
              // If even minimal version fails, just log the error
              console.error(
                'Failed to save even minimal conversation data to localStorage',
                minimalError,
              )
            }
          } else {
            // Some other error occurred
            console.error('Error saving conversation to localStorage:', error)
          }
        }
      } else {
        try {
          localStorage.setItem(
            'selectedConversation',
            JSON.stringify(conversation),
          )
        } catch (error) {
          // Handle localStorage quota exceeded error
          if (
            error instanceof DOMException &&
            (error.name === 'QuotaExceededError' ||
              error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
              error.code === 22 ||
              error.code === 1014)
          ) {
            console.warn(
              'localStorage quota exceeded in saveConversationToLocalStorage, saving minimal conversation data instead',
            )
            clearSingleOldestConversation()

            // Create a minimal version of the conversation with just essential data
            const minimalConversation = {
              id: conversation.id,
              name: conversation.name,
              model: conversation.model,
              temperature: conversation.temperature,
              folderId: conversation.folderId,
              userEmail: conversation.userEmail,
              projectName: conversation.projectName,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
            }

            try {
              // Try to save the minimal version
              localStorage.setItem(
                'selectedConversation',
                JSON.stringify(minimalConversation),
              )
            } catch (minimalError) {
              // If even minimal version fails, just log the error
              console.error(
                'Failed to save even minimal conversation data to localStorage',
                minimalError,
              )
            }
          } else {
            // Some other error occurred
            console.error('Error saving conversation to localStorage:', error)
          }
        }
      }

      successful = true
    }
  } catch (e) {
    console.error('Error saving conversation to localStorage:', e)
  }
  return successful
}

const clearSingleOldestConversation = () => {
  console.debug('CLEARING OLDEST CONVERSATIONS to free space in local storage.')

  const existingConversations = JSON.parse(
    localStorage.getItem('conversationHistory') || '[]',
  )

  // let existingConversations = JSON.parse(localStorage.getItem('conversationHistory') || '[]');
  while (existingConversations.length > 0) {
    existingConversations.shift() // Remove the oldest conversation
    try {
      localStorage.setItem(
        'conversationHistory',
        JSON.stringify(existingConversations),
      )
      break // Exit loop if setItem succeeds
    } catch (error) {
      continue // Try removing another conversation
    }
  }
}

export interface SaveConversationOptions {
  forceFullPayload?: boolean
}

export async function saveConversationToServer(
  conversation: Conversation,
  courseName: string,
  message: Message | null,
  options: SaveConversationOptions = {},
) {
  try {
    const payload: Record<string, unknown> = { course_name: courseName }

    if (message && !options.forceFullPayload) {
      payload.delta = createSaveDeltaPayload(conversation, message)
    } else {
      payload.conversation = conversation
    }

    const response = await fetch('/api/conversation', {
      method: 'POST',
      headers: createHeaders(conversation.userEmail),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to save conversation to server')
    }

    return await response.json()
  } catch (error) {
    console.error('Error saving conversation to server:', error)
    throw error
  }
}

export const saveConversations = (conversations: Conversation[]) => {
  try {
    localStorage.setItem('conversationHistory', JSON.stringify(conversations))
  } catch (error) {
    console.error('Error saving conversations to localStorage:', error)
  }
}

export function createSaveDeltaPayload(
  conversation: Conversation,
  message: Message | null,
  earliestEditedMessageId?: string,
): SaveConversationDelta {
  const meta: ConversationMeta = {
    id: conversation.id,
    name: conversation.name,
    modelId: conversation.model.id,
    prompt: conversation.prompt,
    temperature: conversation.temperature,
    projectName: conversation.projectName,
    folderId: conversation.folderId || null,
    userEmail: conversation.userEmail ?? null,
  }

  const messagesDelta: Message[] = message ? [message] : []

  return {
    conversation: meta,
    messagesDelta,
    earliestEditedMessageId,
  }
}

export function createLogConversationPayload(
  courseName: string,
  conversation: Conversation,
  message: Message | null,
  earliestEditedMessageId?: string,
) {
  if (message) {
    let messagesToInclude: Message[] = []

    if (earliestEditedMessageId && conversation.messages) {
      // Edit case: include all messages from edit point onwards
      const editIndex = conversation.messages.findIndex(
        (m) => m.id === earliestEditedMessageId,
      )
      if (editIndex >= 0) {
        messagesToInclude = conversation.messages.slice(editIndex)
      } else {
        messagesToInclude = [message]
      }
    } else if (conversation.messages && conversation.messages.length >= 2) {
      // Normal case: include the user message that triggered this response + the assistant response
      // The user message is the second-to-last, assistant is last
      const lastIndex = conversation.messages.length - 1
      const userMessage = conversation.messages[lastIndex - 1]
      const assistantMessage = conversation.messages[lastIndex]

      // Only include both if we have a user->assistant pair
      if (
        userMessage?.role === 'user' &&
        assistantMessage?.role === 'assistant'
      ) {
        messagesToInclude = [userMessage, assistantMessage]
      } else {
        // Fallback: just include the provided message
        messagesToInclude = [message]
      }
    } else {
      // Single message or fallback
      messagesToInclude = [message]
    }

    const meta: ConversationMeta = {
      id: conversation.id,
      name: conversation.name,
      modelId: conversation.model.id,
      prompt: conversation.prompt,
      temperature: conversation.temperature,
      projectName: conversation.projectName,
      folderId: conversation.folderId || null,
      userEmail: conversation.userEmail ?? null,
    }

    return {
      course_name: courseName,
      delta: {
        conversation: meta,
        messagesDelta: messagesToInclude,
        earliestEditedMessageId,
      } as SaveConversationDelta,
    }
  }

  return {
    course_name: courseName,
    conversation,
  }
}

// Old method without error handling
// export const saveConversations = (conversations: Conversation[]) => {
//   try {
//     localStorage.setItem('conversationHistory', JSON.stringify(conversations))
//   } catch (e) {
//     console.error(
//       'Error saving conversation history. Clearing storage, then setting convo. Error:',
//       e,
//     )
//     localStorage.setItem('conversationHistory', JSON.stringify(conversations))
//   }
// }

export function reconstructConversation(
  conversation: Conversation | undefined | null,
  fallback?: Conversation,
): Conversation | undefined {
  const source = conversation ?? fallback
  if (!source) return undefined

  const cloned = JSON.parse(JSON.stringify(source)) as Conversation

  if (!Array.isArray(cloned.messages)) {
    cloned.messages = []
  }

  cloned.messages = cloned.messages.map((message) => {
    const normalizedMessage = { ...message }

    if (Array.isArray(normalizedMessage.contexts)) {
      normalizedMessage.contexts = normalizedMessage.contexts.filter(
        (context): context is ContextWithMetadata => context !== null,
      )
    }

    if (Array.isArray(normalizedMessage.tools)) {
      normalizedMessage.tools = normalizedMessage.tools.map((tool) => {
        const normalizedTool = { ...tool }
        if (Array.isArray(normalizedTool.contexts)) {
          normalizedTool.contexts = normalizedTool.contexts.filter(
            (context): context is ContextWithMetadata => context !== null,
          )
        }
        return normalizedTool
      })
    }

    return normalizedMessage
  })

  return cloned
}

export async function logConversationToServer(
  conversation: Conversation,
  course_name: string,
) {
  try {
    const response = await fetch('/api/UIUC-api/logConversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ course_name, conversation }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const errorMessage = errorData?.error || response.statusText
      throw new Error(`Error logging conversation: ${errorMessage}`)
    }

    return response.json().catch(() => null)
  } catch (error) {
    console.error('Error logging conversation to server:', error)
    throw error
  }
}
