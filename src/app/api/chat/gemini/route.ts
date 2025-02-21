import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  GeminiModels,
  type GeminiModel,
  GeminiModelID,
} from '~/utils/modelProviders/types/gemini'
import {
  type GeminiProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'

export async function runGeminiChat(
  conversation: Conversation,
  geminiProvider: GeminiProvider,
  stream: boolean,
) {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }

  if (!geminiProvider.apiKey) {
    throw new Error('Gemini API key is missing')
  }

  try {
    const gemini = createGoogleGenerativeAI({
      apiKey: await decryptKeyIfNeeded(geminiProvider.apiKey),
    })

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    // Validate model ID
    if (
      !Object.values(GeminiModels).some(
        (model) => model.id === conversation.model.id,
      )
    ) {
      throw new Error(`Invalid Gemini model ID: ${conversation.model.id}`)
    }

    const model = gemini(conversation.model.id)
    console.log('Using Gemini model:', conversation.model.id)

    const messages = convertConversationToVercelAISDKv3(conversation)
    console.log('Converted messages:', JSON.stringify(messages, null, 2))

    // Check if we're using vision model with image content 
    const hasImageContent = messages.some(
      (msg) =>
        typeof msg.content === 'object' &&
        Array.isArray(msg.content) &&
        msg.content.some((c) => c.type === 'image'),
    )

    const commonParams = {
      model: model as any,
      messages: messages,
      temperature: conversation.temperature || 0.7,
      maxTokens: conversation.model.tokenLimit || 4096,
    }
    console.log(
      'Request params:',
      JSON.stringify(
        {
          modelId: conversation.model.id,
          temperature: commonParams.temperature,
          maxTokens: commonParams.maxTokens,
          messageCount: messages.length,
        },
        null,
        2,
      ),
    )

    if (stream) {
      try {
        const result = await streamText(commonParams)
        return result.toTextStreamResponse()
      } catch (error) {
        console.error('Gemini streaming error:', error)
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
    } else {
      try {
        const result = await generateText(commonParams)
        const choices = [{ message: { content: result.text } }]
        return { choices }
      } catch (error) {
        console.error('Gemini generation error:', error)
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
  } catch (error) {
    console.error('Gemini API error:', error)
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

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(GeminiModels) as GeminiModel[]

  return NextResponse.json({
    provider: ProviderNames.Gemini,
    models: models,
  })
}
