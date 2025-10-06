// @utils/app/conversation
import { type Conversation, type ConversationPage } from '@/types/chat'
import posthog from 'posthog-js'
import { cleanConversationHistory } from './clean'

export async function fetchConversationHistory(
  searchTerm: string,
  courseName: string,
  pageParam: number,
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
        headers: {
          'Content-Type': 'application/json',
        },
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
): Promise<Conversation | null> {
  try {
    // Grab the first page; server already orders by updated_at DESC in your SQL,
    const res = await fetch(
      `/api/conversation?searchTerm=&courseName=${encodeURIComponent(courseName)}&pageParam=0`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

export const deleteConversationFromServer = async (id: string, course_name: string) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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
) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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

export const saveConversations = (conversations: Conversation[]) => {
  /*
  Note: This function is a workaround for the issue where localStorage is full and cannot save new conversation history.
  TODO: show a modal/pop-up asking user to export them before it gets deleted?
  */

  try {
    localStorage.setItem('conversationHistory', JSON.stringify(conversations))
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
        'localStorage quota exceeded in saveConversations, saving minimal conversation data instead',
      )

      // Create minimal versions of the conversations with just essential data
      const minimalConversations = conversations.map((conversation) => ({
        id: conversation.id,
        name: conversation.name,
        model: conversation.model,
        temperature: conversation.temperature,
        folderId: conversation.folderId,
        userEmail: conversation.userEmail,
        projectName: conversation.projectName,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }))

      try {
        // Try to save the minimal versions
        localStorage.setItem(
          'conversationHistory',
          JSON.stringify(minimalConversations),
        )
      } catch (minimalError) {
        // If even minimal versions fail, try to save just the most recent conversations
        console.warn(
          'Failed to save minimal conversation data, trying to save only recent conversations',
        )

        // Try with just the 5 most recent conversations
        const recentMinimalConversations = minimalConversations.slice(-5)

        try {
          localStorage.setItem(
            'conversationHistory',
            JSON.stringify(recentMinimalConversations),
          )
        } catch (recentError) {
          // If that still fails, log the error
          console.error(
            'Failed to save even recent minimal conversation data to localStorage',
            recentError,
          )

          // Track the error in analytics
          posthog.capture('local_storage_full', {
            course_name:
              conversations?.slice(-1)[0]?.messages?.[0]?.contexts?.[0]
                ?.course_name || 'Unknown Course',
            user_email:
              conversations?.slice(-1)[0]?.userEmail || 'Unknown Email',
            inSaveConversations: true,
          })
        }
      }
    } else {
      // Some other error occurred
      console.error('Error saving conversations to localStorage:', error)

      // Track the error in analytics
      posthog.capture('local_storage_full', {
        course_name:
          conversations?.slice(-1)[0]?.messages?.[0]?.contexts?.[0]
            ?.course_name || 'Unknown Course',
        user_email: conversations?.slice(-1)[0]?.userEmail || 'Unknown Email',
        inSaveConversations: true,
      })
    }
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

export async function saveConversationToServer(conversation: Conversation, course_name: string) {
  const MAX_RETRIES = 3
  let retryCount = 0

  while (retryCount < MAX_RETRIES) {
    try {
      console.debug('Saving conversation to server:', conversation)
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation, course_name }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.error || response.statusText
        throw new Error(`Error saving conversation: ${errorMessage}`)
      }

      return response.json()
    } catch (error: any) {
      console.error(
        `Error saving conversation (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error,
      )
      if (error.code === 'ECONNRESET' && retryCount < MAX_RETRIES - 1) {
        retryCount++
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        continue
      }
      throw error
    }
  }
}
