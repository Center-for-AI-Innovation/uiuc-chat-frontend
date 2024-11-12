import { createOllama } from 'ollama-ai-provider'
import {
  CoreMessage,
  generateText,
  StreamingTextResponse,
  streamText,
} from 'ai'
import { Conversation } from '~/types/chat'
import {
  NCSAHostedProvider,
  OllamaProvider,
} from '~/utils/modelProviders/LLMProvider'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { NextResponse } from 'next/server'

export async function runOllamaChat(
  conversation: Conversation,
  ollamaProvider: OllamaProvider | NCSAHostedProvider,
  stream: boolean,
) {
  if (!ollamaProvider.baseUrl || ollamaProvider.baseUrl === '') {
    ollamaProvider.baseUrl = process.env.OLLAMA_SERVER_URL
  }

  const ollama = createOllama({
    baseURL: `${(await decryptKeyIfNeeded(ollamaProvider.baseUrl!)) as string}/api`,
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const commonParams = {
    model: ollama(conversation.model.id),
    messages: convertConversatonToVercelAISDKv3(conversation),
    temperature: conversation.temperature,
    maxTokens: 4096, // output tokens
  }

  if (stream) {
    const result = await streamText(commonParams)
    return result.toTextStreamResponse()
  } else {
    const result = await generateText(commonParams)
    const choices = [{ message: { content: result.text } }]
    const response = { choices: choices }
    return NextResponse.json(response, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function convertConversatonToVercelAISDKv3(
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

      // just for Llama 3.1 70b, remind it to use proper citation format.
      content +=
        '\n\nIf you use the <Potentially Relevant Documents> in your response, please remember cite your sources using the required formatting, e.g. "The grass is green. [29, page: 11]'
    } else if (Array.isArray(message.content)) {
      // Combine text content from array
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
