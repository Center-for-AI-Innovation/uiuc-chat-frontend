import { type GeminiProvider, ProviderNames } from '../LLMProvider'
import {
  type GeminiModelID,
  GeminiModels,
  preferredGeminiModelIds,
} from '../types/gemini'
import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { NextResponse } from 'next/server'

export const getGeminiModels = async (
  geminiProvider: GeminiProvider,
): Promise<GeminiProvider> => {
  geminiProvider.provider = ProviderNames.Gemini
  delete geminiProvider.error // Clear any previous errors

  if (
    !geminiProvider.apiKey ||
    geminiProvider.apiKey === '' ||
    !geminiProvider.enabled
  ) {
    // Don't show any error here... too confusing for users.
    geminiProvider.models = []
    return geminiProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean }
  >()
  if (geminiProvider.models) {
    geminiProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
      })
    })
  }

  // Initialize models array if it doesn't exist
  geminiProvider.models = geminiProvider.models || []

  // Get all available models from GeminiModels and preserve their states
  const allAvailableModels = Object.values(GeminiModels).map((model) => {
    const existingState = existingModelStates.get(model.id)
    return {
      ...model,
      enabled: existingState?.enabled ?? true,
      default: existingState?.default ?? false,
    }
  })

  // Update models array with the latest information
  geminiProvider.models = allAvailableModels

  // Sort models based on preferred order
  geminiProvider.models.sort((a, b) => {
    const indexA = preferredGeminiModelIds.indexOf(a.id as GeminiModelID)
    const indexB = preferredGeminiModelIds.indexOf(b.id as GeminiModelID)
    return (
      (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    )
  })

  return geminiProvider
}

export async function runGeminiChat(
  conversation: Conversation,
  geminiProvider: GeminiProvider,
  stream = true,
): Promise<any> {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }

  if (!geminiProvider.apiKey) {
    throw new Error('Gemini API key is missing')
  }

  const gemini = createGoogleGenerativeAI({
    apiKey: await decryptKeyIfNeeded(geminiProvider.apiKey),
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  if (
    !Object.values(GeminiModels).some(
      (model) => model.id === conversation.model.id,
    )
  ) {
    throw new Error(`Invalid Gemini model ID: ${conversation.model.id}`)
  }

  const model = gemini(conversation.model.id)

  // Cap output tokens to a safe maximum (many Gemini endpoints cap at 8k)
  const safeMaxTokens = Math.min(8192, conversation.model.tokenLimit || 4096)

  const commonParams = {
    model: model as any,
    messages: convertConversationToVercelAISDKv3(conversation),
    temperature: conversation.temperature || 0.1,
    maxTokens: safeMaxTokens,
  }

  // Disable streaming for models that don't support it (405 Method Not Allowed)
  const modelId = conversation.model.id
  const supportsStreaming = modelId !== 'gemini-2.5-pro-exp-03-25'

  try {
    if (stream && supportsStreaming) {
      const result = await streamText(commonParams)
      return result.toTextStreamResponse()
    } else {
      const result = await generateText(commonParams)
      return NextResponse.json({
        choices: [{ message: { content: result.text } }],
      })
    }
  } catch (error: any) {
    if (
      error instanceof Error &&
      error.message.includes('Developer instruction is not enabled')
    ) {
      throw new Error(
        'This Gemini API key does not have access to the requested model. Please verify your API key permissions in the Google AI Studio.',
      )
    }
    // Fallback: if 405 occurs during streaming, retry without streaming
    const message = (error && (error.message || '')) as string
    if (stream && message && /405|Method Not Allowed/i.test(message)) {
      const result = await generateText(commonParams)
      return NextResponse.json({
        choices: [{ message: { content: result.text } }],
      })
    }
    throw error
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

    let content: any
    if (isLastUserMessage && message.finalPromtEngineeredMessage) {
      content = [{ type: 'text', text: message.finalPromtEngineeredMessage }]
    } else if (Array.isArray(message.content)) {
      content = message.content
        .map((c) => {
          if (c.type === 'text') {
            return { type: 'text', text: c.text }
          } else if (c.type === 'image_url' && c.image_url?.url) {
            return { type: 'image', image: c.image_url.url }
          } else if (c.type === 'tool_image_url' && c.image_url?.url) {
            return { type: 'image', image: c.image_url.url }
          }
          return undefined
        })
        .filter(Boolean)

      if (content.length === 0) {
        content = [{ type: 'text', text: '' }]
      }
    } else {
      content = [{ type: 'text', text: (message.content as string) || '' }]
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content,
    })
  })

  return coreMessages
}
