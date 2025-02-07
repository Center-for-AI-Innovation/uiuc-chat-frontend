// @utils/app/conversation
import { Conversation, ConversationPage } from '@/types/chat'
import posthog from 'posthog-js'
import { cleanConversationHistory } from './clean'

export async function fetchConversationHistory(
  user_email: string,
  searchTerm: string,
  courseName: string,
  pageParam: number,
): Promise<ConversationPage> {
  console.log('\n=== LOADING CONVERSATION HISTORY ===')
  console.log('Parameters:', { user_email, searchTerm, courseName, pageParam })
  
  let finalResponse: ConversationPage = {
    conversations: [],
    nextCursor: null,
  }
  try {
    const response = await fetch(
      `/api/conversation?user_email=${user_email}&searchTerm=${searchTerm}&courseName=${courseName}&pageParam=${pageParam}`,
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
    console.log('\nRaw conversation data received:', {
      number_of_conversations: conversations.length,
      has_next_page: nextCursor !== null
    })

    // Clean the conversations and ensure they're properly structured
    const cleanedConversations = conversations.map((conversation: any) => {
      console.log(`\nAnalyzing conversation ${conversation.id}:`)
      console.log('- Number of messages:', conversation.messages?.length || 0)
      
      // Log details about contexts in each message
      conversation.messages?.forEach((msg: any, idx: number) => {
        console.log(`\n  Message ${idx + 1}:`)
        console.log('  - Role:', msg.role)
        console.log('  - Has content:', !!msg.content)
        console.log('  - Number of contexts:', msg.contexts?.length || 0)
        if (msg.contexts?.length > 0) {
          console.log('  - Context details:')
          msg.contexts.forEach((ctx: any, ctxIdx: number) => {
            console.log(`    Context ${ctxIdx + 1}:`, {
              id: ctx.id,
              has_text: !!ctx.text,
              text_length: ctx.text?.length || 0,
              readable_filename: ctx.readable_filename,
              course_name: ctx.course_name,
              s3_path: ctx.s3_path,
              url: ctx.url,
              base_url: ctx.base_url,
              pagenumber: ctx.pagenumber
            })
          })
        }
      })

      // Ensure messages are properly ordered by creation time
      if (conversation.messages) {
        conversation.messages.sort((a: any, b: any) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
        (c) => c.id === parsed.id
      )
      if (serverConversation) {
        console.log('\nSyncing with localStorage:', {
          conversation_id: serverConversation.id,
          num_messages: serverConversation.messages?.length || 0,
          has_contexts: serverConversation.messages?.some(m => (m.contexts && m.contexts.length > 0) || false)
        })
        localStorage.setItem(
          'selectedConversation',
          JSON.stringify(serverConversation)
        )
      }
    }
    
    console.log('\n=== FINISHED LOADING CONVERSATION HISTORY ===\n')
  } catch (error) {
    console.error('utils/app/conversation.ts - Error fetching conversation history:', error)
  }
  return finalResponse
}

export const deleteConversationFromServer = async (id: string) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      throw new Error('Error deleting conversation')
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
  }
}

export const deleteAllConversationsFromServer = async (
  user_email: string,
  course_name: string,
) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email, course_name }),
    })

    if (!response.ok) {
      throw new Error('Error deleting conversation')
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
  }
}

export const saveConversationToLocalStorage = (conversation: Conversation) => {
  /*
  Save convo to local storage. If storage is full, clear the oldest conversation and try again.
  */
  let successful = false
  while (!successful) {
    try {
      // Get existing conversation to preserve feedback
      const existingConversation = JSON.parse(
        localStorage.getItem('selectedConversation') || '{}'
      );

      // If it's the same conversation, preserve feedback
      if (existingConversation.id === conversation.id) {
        const messagesWithFeedback = conversation.messages.map(msg => {
          const existingMsg = existingConversation.messages?.find((m: typeof msg) => m.id === msg.id);
          return {
            ...msg,
            feedback: existingMsg?.feedback || msg.feedback
          };
        });

        const conversationWithFeedback = {
          ...conversation,
          messages: messagesWithFeedback
        };

        localStorage.setItem('selectedConversation', JSON.stringify(conversationWithFeedback))
      } else {
        localStorage.setItem('selectedConversation', JSON.stringify(conversation))
      }

      successful = true
    } catch (e) {
      console.debug(
        'Error saving conversation history. Clearing storage, then trying again. Error:',
        e,
      )
      posthog.capture('local_storage_full', {
        course_name:
          conversation.messages?.[0]?.contexts?.[0]?.course_name ||
          'Unknown Course',
        user_email: conversation.userEmail,
        inSaveConversation: true,
      })

      clearSingleOldestConversation() // Attempt to clear a bit of storage and try again
    }
  }
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
  } catch (e) {
    posthog.capture('local_storage_full', {
      course_name:
        conversations?.slice(-1)[0]?.messages?.[0]?.contexts?.[0]
          ?.course_name || 'Unknown Course',
      user_email: conversations?.slice(-1)[0]?.userEmail || 'Unknown Email',
      inSaveConversations: true,
    })

    const existingConversations = JSON.parse(
      localStorage.getItem('conversationHistory') || '[]',
    )
    while (
      existingConversations.length > 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      existingConversations.shift() // Remove the oldest conversation
      try {
        localStorage.setItem(
          'conversationHistory',
          JSON.stringify(existingConversations),
        )
        e = null // Clear the error since space has been freed
      } catch (error) {
        e = error // Update the error if it fails again
        continue // Try removing another conversation
      }
    }
    if (
      existingConversations.length === 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      console.error(
        'Failed to free enough space to save new conversation history.',
      )
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

export async function saveConversationToServer(conversation: Conversation) {
  try {
    console.log('=== SAVING CONVERSATION TO SERVER ===')
    console.log('Conversation ID:', conversation.id)
    console.log('Number of messages:', conversation.messages?.length)
    
    // Log context information for each message
    conversation.messages?.forEach((message, index) => {
      console.log(`\nMessage ${index + 1} Contexts:`, {
        message_id: message.id,
        role: message.role,
        num_contexts: message.contexts?.length || 0,
        contexts_details: message.contexts?.map(ctx => ({
          id: ctx.id,
          readable_filename: ctx.readable_filename,
          text_length: ctx.text?.length || 0,
          s3_path: ctx.s3_path,
          url: ctx.url
        }))
      })
    })
    
    console.log('=== END SAVING CONVERSATION ===\n')
    console.debug('Saving conversation to server:', conversation)
    const response = await fetch('/api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    })
    if (!response.ok) {
      throw new Error('Error saving conversation')
    }
    return response.json()
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}
