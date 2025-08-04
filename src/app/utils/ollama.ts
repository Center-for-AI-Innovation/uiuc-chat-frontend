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
  try {
    if (!ollamaProvider.baseUrl || ollamaProvider.baseUrl === '') {
      ollamaProvider.baseUrl = process.env.OLLAMA_SERVER_URL
    }

    // Check if provider is properly configured
    if (!ollamaProvider.baseUrl) {
      throw new Error('Ollama server URL is not configured. Set it up in the Admin Dashboard, or use a different LLM.')
    }

    try {
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
    } catch (apiError) {
      console.error('Ollama API error:', apiError)

      // Handle specific API errors
      if (apiError instanceof Error) {
        if (apiError.message.includes('timeout') || apiError.message.includes('ECONNREFUSED') || apiError.message.includes('ECONNRESET')) {
          throw new Error(`Ollama server connection failed: ${apiError.message}. Please check if the Ollama server is running.`)
        } else if (apiError.message.includes('not found') || apiError.message.includes('404')) {
          throw new Error(`Ollama model '${conversation.model.id}' not found on server. Please check if the model is installed.`)
        } else {
          throw apiError // rethrow with original context
        }
      } else {
        throw new Error('Unknown error when connecting to Ollama')
      }
    }
  } catch (error) {
    console.error('Error in runOllamaChat:', error)
    // return error
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred when running Ollama',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
