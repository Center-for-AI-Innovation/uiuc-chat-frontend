// utils/apiUtils.ts
import { CoreMessage } from 'ai'
import { Conversation, Message } from '~/types/chat'
// Configuration for runtime environment

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_ENV == 'production') return 'https://uiuc.chat'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

/**
 * Gets the backend URL from environment variables.
 * Throws an error if RAILWAY_URL is not configured.
 * @returns {string} - The validated backend URL
 * @throws {Error} - If RAILWAY_URL is not set
 */
export const getBackendUrl = (): string => {
  const backendUrl = process.env.RAILWAY_URL

  if (!backendUrl) {
    throw new Error(
      'Backend URL is not configured. Please set the RAILWAY_URL environment variable.',
    )
  }

  // Remove trailing slash if present for consistency
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
}

export function convertConversatonToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  // Add system message as the first message
  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    console.log(
      'Found system message, latestSystemMessage: ',
      systemMessage.latestSystemMessage,
    )
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  // Convert other messages
  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return // Skip system message as it's already added

    let content: string
    if (index === conversation.messages.length - 1 && message.role === 'user') {
      // Use finalPromtEngineeredMessage for the most recent user message
      content = message.finalPromtEngineeredMessage || ''
    } else if (Array.isArray(message.content)) {
      // Handle both text and file content
      const textParts: string[] = []

      message.content.forEach((c) => {
        if (c.type === 'text') {
          textParts.push(c.text || '')
        } else if (c.type === 'file') {
          // Convert file content to text representation
          textParts.push(
            `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          )
        }
      })

      content = textParts.join('\n')
    } else {
      content = message.content as string
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content: content,
    })
  })

  return coreMessages
}

export function convertConversationToCoreMessagesWithoutSystem(
  conversation: Conversation,
): CoreMessage[] {
  function processMessageContent(message: Message, isLastUserMessage: boolean) {
    let content: any[]

    if (isLastUserMessage && message.finalPromtEngineeredMessage) {
      content = [{ type: 'text', text: message.finalPromtEngineeredMessage }]
    } else if (Array.isArray(message.content)) {
      content = message.content.map((c) => {
        if (c.type === 'text') {
          return { type: 'text', text: c.text }
        } else if (c.type === 'image_url') {
          return { type: 'image', image: c.image_url!.url }
        } else if (c.type === 'file') {
          // Convert file content to text representation
          return {
            type: 'text',
            text: `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          }
        }
        return c
      })
    } else {
      content = [{ type: 'text', text: message.content as string }]
    }

    return content
  }

  return conversation.messages
    .filter((message) => message.role !== 'system')
    .map((message, index) => {
      const isLastUserMessage =
        index === conversation.messages.length - 1 && message.role === 'user'
      console.log(
        'Processing message:',
        message.role,
        isLastUserMessage ? '(last user message)' : '',
      )

      return {
        role: message.role as 'user' | 'assistant',
        content: processMessageContent(message, isLastUserMessage),
      }
    })
}

// Export all functions as part of the API Utils module
export default {}
