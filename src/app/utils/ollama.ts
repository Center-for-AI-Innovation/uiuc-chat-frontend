import { createOllama } from 'ollama-ai-provider'
import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import {
  type NCSAHostedProvider,
  type OllamaProvider,
} from '~/utils/modelProviders/LLMProvider'
import { OllamaModelIDs } from '~/utils/modelProviders/ollama'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { NextResponse } from 'next/server'

/**
 * Handle Ollama reasoning models with streaming
 * Ollama returns reasoning in `message.thinking` field
 * We transform this to `<think>` tags for UI display
 */
async function handleOllamaReasoningStream(
  baseUrl: string,
  conversation: Conversation,
  thinkParam: boolean | string,
): Promise<Response> {
  const messages = convertConversatonToVercelAISDKv3(conversation).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NCSA_HOSTED_API_KEY || ''}`,
    },
    body: JSON.stringify({
      model: conversation.model.id,
      messages,
      think: thinkParam,
      stream: true,
      options: {
        temperature: conversation.temperature,
        num_ctx: conversation.model.tokenLimit,
      },
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
  }

  // Transform Ollama's native format to text stream with <think> tags
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  let isThinkingOpen = false
  let hasStartedContent = false

  const transformedStream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            // Close thinking tag if still open
            if (isThinkingOpen) {
              controller.enqueue(encoder.encode('</think>\n'))
            }
            controller.close()
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((line) => line.trim())

          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              const message = data.message

              if (!message) continue

              let output = ''

              // Handle thinking content
              if (message.thinking) {
                if (!isThinkingOpen) {
                  output += '<think>'
                  isThinkingOpen = true
                }
                output += message.thinking
              }

              // Handle regular content
              if (message.content) {
                if (isThinkingOpen && !hasStartedContent) {
                  output += '</think>\n'
                  isThinkingOpen = false
                  hasStartedContent = true
                }
                output += message.content
              }

              if (output) {
                controller.enqueue(encoder.encode(output))
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      } catch (error) {
        if (isThinkingOpen) controller.enqueue(encoder.encode('</think>\n'))
        controller.error(error)
      }
    },
  })

  return new Response(transformedStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// Ollama models that support reasoning via the `think` parameter
// These use message.thinking field in the response
const OllamaReasoningModels = new Set([
  OllamaModelIDs.GPT_OSS_120B,
  OllamaModelIDs.GPT_OSS_20B,
  OllamaModelIDs.DEEPSEEK_R1_70B,
  OllamaModelIDs.DEEPSEEK_R1_32B,
  OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16,
  OllamaModelIDs.QWEN3_32B,
])

// GPT-OSS requires 'low'/'medium'/'high' instead of true/false
const GPT_OSS_MODELS = new Set([
  OllamaModelIDs.GPT_OSS_120B,
  OllamaModelIDs.GPT_OSS_20B,
])

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
      throw new Error(
        'Ollama server URL is not configured. Set it up in the Admin Dashboard, or use a different LLM.',
      )
    }

    const baseUrl = await decryptKeyIfNeeded(ollamaProvider.baseUrl!) as string
    const isReasoningModel = OllamaReasoningModels.has(conversation.model.id as OllamaModelIDs)
    const isGptOss = GPT_OSS_MODELS.has(conversation.model.id as OllamaModelIDs)

    if (isReasoningModel && stream) {
      return await handleOllamaReasoningStream(
        baseUrl,
        conversation,
        isGptOss ? 'medium' : true,
      )
    }

    try {
      const ollama = createOllama({
        baseURL: `${baseUrl}/api`,
        headers: {
          Authorization: `Bearer ${process.env.NCSA_HOSTED_API_KEY || ''}`,
        },
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
        if (
          apiError.message.includes('timeout') ||
          apiError.message.includes('ECONNREFUSED') ||
          apiError.message.includes('ECONNRESET')
        ) {
          throw new Error(
            `Ollama server connection failed: ${apiError.message}. Please check if the Ollama server is running.`,
          )
        } else if (
          apiError.message.includes('not found') ||
          apiError.message.includes('404')
        ) {
          throw new Error(
            `Ollama model '${conversation.model.id}' not found on server. Please check if the model is installed.`,
          )
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
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred when running Ollama',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
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
    // console.log(
    //     'Found system message, latestSystemMessage: ',
    //     systemMessage.latestSystemMessage,
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
    if (index === conversation.messages.length - 1 && message.role === 'user' && message.finalPromtEngineeredMessage) {
      content = message.finalPromtEngineeredMessage
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
