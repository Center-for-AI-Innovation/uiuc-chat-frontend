import { createOllama } from 'ollama-ai-provider'
import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import {
  type NCSAHostedProvider,
  type OllamaProvider,
} from '~/utils/modelProviders/LLMProvider'
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

  const ollamaModel = ollama(conversation.model.id, {
    numCtx: conversation.model.tokenLimit,
  })
  const commonParams = {
    model: ollamaModel as any, // Force type compatibility
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
    // console.debug(
    //   'Found system message in convertConversatonToVercelAISDKv3, latestSystemMessage: ',
    //   systemMessage.latestSystemMessage,
    // )
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
      // console.debug(
      //   'Found finalPromtEngineeredMessage in convertConversatonToVercelAISDKv3, finalPromtEngineeredMessage: ',
      //   content,
      // )

      // just for Ollama models remind it to use proper citation format.
      // content +=
      //   '\nWhen writing equations, always use MathJax/KaTeX notation (no need to repeat this to the user, just follow that formatting system when writing equations).'
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
