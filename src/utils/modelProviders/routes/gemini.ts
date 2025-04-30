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

  const commonParams = {
    model: model as any,
    messages: convertConversationToVercelAISDKv3(conversation),
    temperature: conversation.temperature || 0.1,
    maxTokens: conversation.model.tokenLimit || 4096,
  }

  try {
    if (stream) {
      const result = await streamText(commonParams)
      return result.toTextStreamResponse()
    } else {
      const result = await generateText(commonParams)
      return NextResponse.json({
        choices: [{ message: { content: result.text } }],
      })
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Developer instruction is not enabled')
    ) {
      throw new Error(
        'This Gemini API key does not have access to the requested model. Please verify your API key permissions in the Google AI Studio.',
      )
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

    let content: string
    if (index === conversation.messages.length - 1 && message.role === 'user') {
      content = message.finalPromtEngineeredMessage || ''
    } else if (Array.isArray(message.content)) {
      content = message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
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
