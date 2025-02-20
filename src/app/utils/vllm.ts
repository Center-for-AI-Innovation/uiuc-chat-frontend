import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { type NCSAHostedVLMProvider } from '~/utils/modelProviders/LLMProvider'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createOpenAI } from '@ai-sdk/openai'

export async function runVLLM(
  conversation: Conversation,
  ncsaHostedVLMProvider: NCSAHostedVLMProvider,
  stream: boolean,
) {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }

  const vlmModel = createOpenAI({
    baseURL: process.env.NCSA_HOSTED_VLM_BASE_URL,
    apiKey: 'non-empty',
    compatibility: 'compatible', // strict/compatible - enable 'strict' when using the OpenAI API
  })
  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const model = vlmModel(conversation.model.id)

  const commonParams = {
    model: model,
    messages: convertConversationToVercelAISDKv3(conversation),
    temperature: conversation.temperature,
    maxTokens: 8192,
  }

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
