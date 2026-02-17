import type { Conversation } from '~/types/chat'
import type { SambaNovaProvider } from '~/utils/modelProviders/LLMProvider'
import { createOpenAI } from '@ai-sdk/openai'
import { decrypt } from '~/utils/crypto'
import { SambaNovaModels } from '~/utils/modelProviders/types/SambaNova'
import { type ModelMessage, generateText, streamText } from 'ai'

export async function runSambaNovaChat(
  conversation: Conversation,
  sambaNovaProvider: SambaNovaProvider,
  stream: boolean,
) {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }

  if (!sambaNovaProvider.apiKey) {
    throw new Error('SambaNova API key is missing')
  }

  try {
    const openai = createOpenAI({
      baseURL: 'https://api.sambanova.ai/v1',

      apiKey: await decrypt(
        sambaNovaProvider.apiKey,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      ),
    })

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    // Validate model ID
    if (
      !Object.values(SambaNovaModels).some(
        (model) => model.id === conversation.model.id,
      )
    ) {
      throw new Error(`Invalid SambaNova model ID: ${conversation.model.id}`)
    }

    // Use .chat() to use Chat Completions API instead of Responses API
    const model = openai.chat(conversation.model.id)
    console.log('Using SambaNova model:', conversation.model.id)

    const messages = convertConversationToVercelAISDKv3(conversation)
    console.log('Converted messages:', JSON.stringify(messages, null, 2))

    // Get model's token limit
    const modelConfig = Object.values(SambaNovaModels).find(
      (m) => m.id === conversation.model.id,
    )
    if (!modelConfig) {
      throw new Error(
        `Model configuration not found for ${conversation.model.id}`,
      )
    }

    const commonParams = {
      model: model as any,
      messages: messages,
      temperature: conversation.temperature || 0.7,
      maxOutputTokens: 4096,
    }

    console.log(
      'Request params:',
      JSON.stringify(
        {
          modelId: conversation.model.id,
          temperature: commonParams.temperature,
          maxOutputTokens: commonParams.maxOutputTokens,
          messageCount: messages.length,
        },
        null,
        2,
      ),
    )

    if (stream) {
      try {
        const result = streamText(commonParams)
        return result.toTextStreamResponse()
      } catch (error) {
        console.log('SambaNova streaming error:', error)
        console.error('SambaNova streaming error:', error)
        throw error
      }
    } else {
      try {
        const result = await generateText(commonParams)
        const choices = [{ message: { content: result.text } }]
        return { choices }
      } catch (error) {
        console.log('SambaNova generation error:', error)
        console.error('SambaNova generation error:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('SambaNova API error:', error)
    throw error
  }
}

function convertConversationToVercelAISDKv3(
  conversation: Conversation,
): ModelMessage[] {
  const coreMessages: ModelMessage[] = []

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
