import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { type OpenAICompatibleProvider } from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { createOpenAI } from '@ai-sdk/openai'
export const dynamic = 'force-dynamic'

export async function runOpenAICompatibleChat(
  conversation: Conversation,
  openAICompatibleProvider: OpenAICompatibleProvider,
  stream: boolean,
): Promise<Response> {
  try {
    if (!conversation) {
      throw new Error('Conversation is missing')
    }

    if (!openAICompatibleProvider.apiKey) {
      throw new Error('OpenAI-compatible API key is missing')
    }

    if (!openAICompatibleProvider.baseUrl) {
      throw new Error('OpenAI-compatible base URL is missing')
    }

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    const openAICompatible = createOpenAI({
      baseURL: openAICompatibleProvider.baseUrl,
      apiKey: await decryptKeyIfNeeded(openAICompatibleProvider.apiKey),
      compatibility: 'compatible',
    })

    const model = openAICompatible(conversation.model.id)

    const commonParams = {
      model: model,
      messages: convertConversationToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxTokens: 16384, // Default token limit
    }

    try {
      if (stream) {
        const result = await streamText(commonParams as any)
        return result.toTextStreamResponse()
      } else {
        const result = await generateText(commonParams as any)
        return new Response(
          JSON.stringify({ choices: [{ message: { content: result.text } }] }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    } catch (error) {
      console.error('OpenAI-compatible API error:', error)
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error(`OpenAI-compatible request timed out: ${error.message}`)
      } else if (error instanceof Error && error.message.includes('apiKey')) {
        throw new Error(
          `OpenAI-compatible authentication error: Please check API configuration`,
        )
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('Error in runOpenAICompatibleChat:', error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred when running OpenAI-compatible model',
        detailed_error:
          error instanceof Error ? error.toString() : 'Unknown error',
        source: 'OpenAICompatible',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

function convertConversationToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return

    const isLastUserMessage =
      index === conversation.messages.length - 1 && message.role === 'user'

    // Handle array content (text, images, files)
    if (Array.isArray(message.content)) {
      const contentParts: Array<
        | string
        | { type: 'image_url'; image_url: { url: string } }
        | { type: 'text'; text: string }
      > = []

      message.content.forEach((c) => {
        if (c.type === 'text') {
          const text = isLastUserMessage
            ? message.finalPromtEngineeredMessage || c.text || ''
            : c.text || ''
          if (text) {
            contentParts.push(text)
          }
        } else if (c.type === 'image_url' || c.type === 'tool_image_url') {
          // Handle image content
          const imageUrl = c.image_url?.url || ''
          if (imageUrl) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: imageUrl },
            })
          }
        } else if (c.type === 'file') {
          // Convert file content to text representation
          contentParts.push(
            `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          )
        }
      })

      // If we have mixed content (text + images), use array format
      // Otherwise, use string format for text-only
      const hasImages = contentParts.some(
        (part) => typeof part === 'object' && part.type === 'image_url',
      )

      if (hasImages || contentParts.length > 1) {
        // For OpenAI compatible mode, convert to proper format
        // Filter strings and convert to text objects, keep image objects as-is
        const formattedContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = []
        contentParts.forEach((part) => {
          if (typeof part === 'string') {
            formattedContent.push({ type: 'text', text: part })
          } else if (part.type === 'image_url') {
            formattedContent.push(part)
          } else if (part.type === 'text') {
            formattedContent.push(part)
          }
        })
        coreMessages.push({
          role: message.role as 'user' | 'assistant',
          content: formattedContent,
        } as CoreMessage)
      } else {
        // Single text content - use string format
        const textContent = typeof contentParts[0] === 'string' 
          ? contentParts[0] 
          : contentParts[0]?.type === 'text' 
            ? contentParts[0].text 
            : ''
        if (textContent) {
          coreMessages.push({
            role: message.role as 'user' | 'assistant',
            content: textContent,
          })
        }
      }
    } else {
      // Handle string content
      const content = isLastUserMessage
        ? message.finalPromtEngineeredMessage || (message.content as string)
        : (message.content as string)

      coreMessages.push({
        role: message.role as 'user' | 'assistant',
        content: content,
      })
    }
  })

  return coreMessages
}
