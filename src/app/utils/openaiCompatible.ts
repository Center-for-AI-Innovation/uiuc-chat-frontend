import { type CoreMessage, streamText } from 'ai'
import { smoothStream } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { type Conversation } from '~/types/chat'
import {
  type OpenAICompatibleProvider,
  ReasoningCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
export const dynamic = 'force-dynamic'

const PROVIDER_NAME = 'openai-compatible'

/**
 * Reasoning request parameter patterns:
 * - 'reasoning_effort': Groq-style - requires { reasoning_effort: 'medium' } in request body
 * - 'openrouter': OpenRouter-style - requires { reasoning: { effort: 'medium' } } via providerOptions
 * - 'none': No special param needed - provider outputs reasoning by default (Cerebras, Mistral, etc.)
 */
type ReasoningRequestPattern = 'reasoning_effort' | 'openrouter' | 'none'

/**
 * Detect what reasoning request pattern to use based on the base URL
 * Only Groq requires special request parameters, others output reasoning by default
 */
function detectReasoningRequestPattern(baseUrl: string): ReasoningRequestPattern {
  try {
    const parsedUrl = new URL(baseUrl)
    const hostname = parsedUrl.hostname.toLowerCase()
    // Groq requires reasoning_effort parameter for gpt-oss models
    if (hostname === 'api.groq.com' || hostname.endsWith('.groq.com')) {
      return 'reasoning_effort'
    }
    // OpenRouter uses providerOptions (handled separately in AI SDK)
    if (hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai')) {
      return 'openrouter'
    }
  } catch {
    // Invalid URL, fall through to default
  }
  // All other providers output reasoning by default without special params
  return 'none'
}

/**
 * Add reasoning parameters to request body based on detected pattern
 */
function addReasoningParams(body: Record<string, unknown>, pattern: ReasoningRequestPattern): Record<string, unknown> {
  if (pattern === 'reasoning_effort') {
    // Groq-style: add reasoning_effort as top-level string parameter
    // Supported values: 'low', 'medium', 'high'
    return {
      ...body,
      reasoning_effort: 'medium',
    }
  }
  // OpenRouter is handled via providerOptions, others need no special params
  return body
}

/**
 * Runs an OpenAI-compatible chat with reasoning token support
 * Supports multiple providers: OpenRouter, DeepSeek, Groq, Cerebras, Mistral, custom
 */
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

    const isReasoningModel = Array.from(ReasoningCapableModels).some(
      (modelId) =>
        modelId.toLowerCase() === conversation.model.id.toLowerCase(),
    )

    const apiKey = await decryptKeyIfNeeded(openAICompatibleProvider.apiKey)
    const baseUrl = openAICompatibleProvider.baseUrl

    const reasoningPattern = detectReasoningRequestPattern(baseUrl)

    const provider = createOpenAICompatible({
      name: PROVIDER_NAME,
      baseURL: baseUrl,
      apiKey: apiKey,
      fetch: isReasoningModel && stream
        ? createReasoningFetchMiddleware(reasoningPattern)
        : undefined,
    })

    const model = provider(conversation.model.id)

    const commonParams = {
      model: model,
      messages: convertConversationToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxTokens: 16384,
      // OpenRouter requires reasoning via providerOptions
      ...(isReasoningModel && reasoningPattern === 'openrouter' && {
        providerOptions: {
          [PROVIDER_NAME]: {
            reasoning: { effort: 'medium' },
          },
        },
      }),
    }

    if (stream) {
      return await handleStreamingResponse(commonParams)
    } else {
      return await handleNonStreamingResponse(baseUrl, apiKey, conversation, isReasoningModel)
    }
  } catch (error) {
    console.error('OpenAI-compatible error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        detailed_error: error instanceof Error ? error.toString() : 'Unknown error',
        source: 'OpenAICompatible',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/**
 * Custom fetch middleware to handle reasoning for multiple providers
 * - Modifies request body with reasoning parameters based on detected pattern
 * - Transforms response stream to extract reasoning into <think> tags
 * 
 * Response formats handled (all providers):
 * - delta.reasoning (Groq, Cerebras)
 * - delta.reasoning_details[].text (OpenRouter)
 * - delta.reasoning_content (DeepSeek)
 * - delta.content[].type="thinking" (Mistral Magistral)
 */
function createReasoningFetchMiddleware(reasoningPattern: ReasoningRequestPattern) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let modifiedInit = init
    if (init?.body && reasoningPattern === 'reasoning_effort') {
      try {
        const body = JSON.parse(init.body as string)
        modifiedInit = { ...init, body: JSON.stringify(addReasoningParams(body, reasoningPattern)) }
      } catch { /* ignore parse errors */ }
    }
    
    const response = await fetch(input, modifiedInit)
    if (!response.ok || !response.body) return response

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/event-stream')) return response
    // Transform stream to extract reasoning
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    let buffer = ''
    let isThinkingOpen = false
    let hasStartedContent = false
    let modelOutputsThinkTags: boolean | null = null

    const transformedStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              // Process remaining buffer
              if (buffer.trim()) {
                const result = processChunk(buffer)
                if (result.output) {
                  controller.enqueue(encoder.encode(result.output))
                }
              }
              // Close thinking tag if still open
              if (isThinkingOpen) {
                const closeEvent = `data: ${JSON.stringify({ choices: [{ delta: { content: '</think>\n' } }] })}\n\n`
                controller.enqueue(encoder.encode(closeEvent))
              }
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })

            // Process complete SSE events (split by double newline)
            const parts = buffer.split('\n\n')
            buffer = parts.pop() || ''

            for (const part of parts) {
              if (!part.trim()) continue
              const result = processChunk(part)
              if (result.output) {
                controller.enqueue(encoder.encode(result.output + '\n\n'))
              }
            }
          }
        } catch (error) {
          if (isThinkingOpen) controller.enqueue(encoder.encode('</think>\n'))
          controller.error(error)
        }
      },
    })

    function processChunk(chunk: string): { output: string } {
      const lines = chunk.split('\n')
      let output = ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          output += line + '\n'
          continue
        }

        if (line === 'data: [DONE]') {
          output += 'data: [DONE]'
          continue
        }

        const jsonStr = line.slice(6)
        if (!jsonStr.trim()) continue

        try {
          const data = JSON.parse(jsonStr)
          const delta = data.choices?.[0]?.delta

          if (!delta) {
            output += line + '\n'
            continue
          }

          let reasoningText = ''
          let contentText = ''

          // Extract reasoning from various provider formats:
          // 1. OpenRouter: reasoning_details[].text
          if (delta.reasoning_details && Array.isArray(delta.reasoning_details)) {
            for (const detail of delta.reasoning_details) {
              if (detail.type === 'reasoning.text' && detail.text) {
                reasoningText += detail.text
              }
            }
          }
          // 2. Groq/Cerebras: reasoning (simple string)
          if (delta.reasoning && typeof delta.reasoning === 'string') {
            reasoningText += delta.reasoning
          }
          // 3. DeepSeek: reasoning_content
          if (delta.reasoning_content && typeof delta.reasoning_content === 'string') {
            reasoningText += delta.reasoning_content
          }
          // 4. Mistral Magistral: content array with { type: "thinking" } objects
          if (Array.isArray(delta.content)) {
            for (const item of delta.content) {
              if (item.type === 'thinking' && Array.isArray(item.thinking)) {
                for (const thought of item.thinking) {
                  if (thought.type === 'text' && thought.text) {
                    reasoningText += thought.text
                  }
                }
              } else if (item.type === 'text' && item.text) {
                contentText += item.text
              }
            }
          }

          // Handle regular content (string format)
          if (typeof delta.content === 'string' && delta.content) {
            // Check if model outputs <think> tags natively (first chunk)
            if (modelOutputsThinkTags === null) {
              modelOutputsThinkTags = delta.content.trimStart().startsWith('<think>')
            }
            // If native tags, pass through unchanged
            if (modelOutputsThinkTags) {
              output += line + '\n'
              continue
            }
            contentText = delta.content
          }

          // Build new content with <think> tags
          let newContent = ''

          if (reasoningText) {
            if (!isThinkingOpen) {
              newContent += '<think>'
              isThinkingOpen = true
            }
            newContent += reasoningText
          }

          if (contentText) {
            if (isThinkingOpen && !hasStartedContent) {
              newContent += '</think>\n'
              isThinkingOpen = false
              hasStartedContent = true
            }
            newContent += contentText
          }

          if (newContent) {
            const newDelta = { ...delta, content: newContent }
            delete newDelta.reasoning
            delete newDelta.reasoning_details
            delete newDelta.reasoning_content
            const newData = { ...data, choices: [{ ...data.choices[0], delta: newDelta }] }
            output += `data: ${JSON.stringify(newData)}\n`
          } else {
            output += line + '\n'
          }
        } catch {
          output += line + '\n'
        }
      }

      return { output: output.trimEnd() }
    }

    return new Response(transformedStream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }
}

async function handleStreamingResponse(commonParams: any): Promise<Response> {
  const result = await streamText({
    ...commonParams,
    experimental_transform: [smoothStream({ chunking: 'word' })],
  })
  return result.toTextStreamResponse()
}

async function handleNonStreamingResponse(
  baseUrl: string,
  apiKey: string,
  conversation: Conversation,
  isReasoningModel: boolean,
): Promise<Response> {
  const reasoningPattern = detectReasoningRequestPattern(baseUrl)
  
  let requestBody: Record<string, unknown> = {
    model: conversation.model.id,
    messages: convertConversationToVercelAISDKv3(conversation).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature: conversation.temperature,
    max_tokens: 16384,
    stream: false,
  }
  
  // Add reasoning parameters based on detected pattern
  if (isReasoningModel) {
    if (reasoningPattern === 'openrouter') {
      requestBody.reasoning = { effort: 'medium' }
    } else {
      requestBody = addReasoningParams(requestBody, reasoningPattern)
    }
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message
  if (!message) throw new Error('No message in response')

  let content = ''
  let reasoning = ''

  // Handle Mistral Magistral format: content is array with type: "thinking" and type: "text"
  if (Array.isArray(message.content)) {
    for (const item of message.content) {
      if (item.type === 'thinking' && Array.isArray(item.thinking)) {
        for (const thought of item.thinking) {
          if (thought.type === 'text' && thought.text) {
            reasoning += thought.text
          }
        }
      } else if (item.type === 'text' && item.text) {
        content += item.text
      }
    }
  } else {
    content = message.content || ''
  }

  const hasNativeThinkTags = content.includes('<think>')

  if (isReasoningModel && !hasNativeThinkTags) {
    // Extract from various formats (if not already extracted from Mistral format)
    if (!reasoning) {
      if (message.reasoning_details && Array.isArray(message.reasoning_details)) {
        for (const detail of message.reasoning_details) {
          if (detail.type === 'reasoning.text' && detail.text) {
            reasoning += detail.text
          }
        }
      }
      if (message.reasoning) reasoning += message.reasoning
      if (message.reasoning_content) reasoning += message.reasoning_content
    }

    if (reasoning) {
      content = `<think>${reasoning}</think>\n${content}`
    }
  }

  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

function convertConversationToVercelAISDKv3(conversation: Conversation): CoreMessage[] {
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
          if (text) contentParts.push(text)
        } else if (c.type === 'image_url' || c.type === 'tool_image_url') {
          const imageUrl = c.image_url?.url || ''
          if (imageUrl) {
            contentParts.push({ type: 'image_url', image_url: { url: imageUrl } })
          }
        } else if (c.type === 'file') {
          contentParts.push(
            `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          )
        }
      })

      const hasImages = contentParts.some(
        (part) => typeof part === 'object' && part.type === 'image_url',
      )

      if (hasImages || contentParts.length > 1) {
        const formattedContent: Array<
          | { type: 'text'; text: string }
          | { type: 'image_url'; image_url: { url: string } }
        > = []
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
        const textContent =
          typeof contentParts[0] === 'string'
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
