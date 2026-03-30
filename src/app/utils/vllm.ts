import {
  createParser,
  type ParsedEvent,
  type ReconnectInterval,
} from 'eventsource-parser'
import { type CoreMessage } from 'ai'
import { type Conversation } from '~/types/chat'

export const dynamic = 'force-dynamic'

interface VLLMChatMessage {
  reasoning?: string | null
  content?: string | null
}

interface VLLMChatCompletionResponse {
  choices?: Array<{
    message?: VLLMChatMessage
  }>
}

interface VLLMChatCompletionChunk {
  choices?: Array<{
    delta?: {
      reasoning?: string
      content?: string
    }
  }>
}

function buildVLLMResponseContent({
  content,
  reasoning,
}: {
  content: string
  reasoning?: string | null
}): string {
  const normalizedReasoning = reasoning?.trim()

  if (normalizedReasoning) {
    const normalizedContent = content.trimStart()
    return normalizedContent.length > 0
      ? `<think>${normalizedReasoning}</think>\n\n${normalizedContent}`
      : `<think>${normalizedReasoning}</think>`
  }

  return content.trimStart()
}

function normalizeVLLMStreamResponse(response: Response): Response {
  if (!response.body) {
    return response
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const normalizedStream = new ReadableStream({
    async start(controller) {
      let isThinkingOpen = false
      let hasStartedContent = false

      const emit = (text: string) => {
        if (text.length > 0) {
          controller.enqueue(encoder.encode(text))
        }
      }

      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type !== 'event') {
          return
        }

        const data = event.data
        if (data.trim() === '[DONE]') {
          if (isThinkingOpen) {
            emit('</think>\n\n')
            isThinkingOpen = false
          }
          controller.close()
          return
        }

        try {
          const json = JSON.parse(data) as VLLMChatCompletionChunk
          const choice = json.choices?.[0]
          const delta = choice?.delta

          if (!delta) {
            return
          }

          const reasoningText = delta.reasoning ?? ''
          const contentText = delta.content ?? ''

          let output = ''

          if (reasoningText) {
            if (!isThinkingOpen) {
              output += '<think>'
              isThinkingOpen = true
            }
            output += reasoningText
          }

          if (contentText) {
            const normalizedContentText = hasStartedContent
              ? contentText
              : contentText.trimStart()
            if (isThinkingOpen && !hasStartedContent) {
              output += '</think>\n\n'
              isThinkingOpen = false
            }
            hasStartedContent = true
            output += normalizedContentText
          }

          emit(output)
        } catch (error) {
          controller.error(error)
        }
      }

      const parser = createParser(onParse)

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            if (isThinkingOpen) {
              emit('</think>\n\n')
            }
            controller.close()
            return
          }

          const decodedChunk = decoder.decode(value, { stream: true })
          parser.feed(decodedChunk)
        }
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(normalizedStream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export async function runVLLM(conversation: Conversation, stream: boolean) {
  try {
    if (!conversation) {
      throw new Error('Conversation is missing')
    }

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    const modelId = conversation.model.id
    const baseUrl = process.env.NCSA_HOSTED_VLM_BASE_URL
    const apiKey = process.env.NCSA_HOSTED_API_KEY || ''

    const requestBody = {
      model: modelId,
      messages: convertConversationToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      max_tokens: 8192,
      top_p: 0.8,
      repetition_penalty: 1.05,
      stream,
    }

    try {
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
        throw new Error(`VLLM API error ${response.status}: ${errorText}`)
      }

      if (stream) {
        return normalizeVLLMStreamResponse(response)
      }

      const data = (await response.json()) as VLLMChatCompletionResponse
      const message = data.choices?.[0]?.message
      const content = message?.content ?? ''
      const reasoning = message?.reasoning

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: buildVLLMResponseContent({
                  content,
                  reasoning,
                }),
              },
            },
          ],
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    } catch (error) {
      console.error('VLLM API error:', error)
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error(`VLLM request timed out: ${error.message}`)
      } else if (error instanceof Error && error.message.includes('apiKey')) {
        throw new Error(
          `VLLM authentication error: Please check API configuration`,
        )
      } else {
        throw error // rethrow the original error with context
      }
    }
  } catch (error) {
    console.error('Error in runVLLM:', error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred when running VLLM',
        detailed_error:
          error instanceof Error ? error.toString() : 'Unknown error',
        source: 'VLLM',
      }),
      {
        status: 500,
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

export { buildVLLMResponseContent, normalizeVLLMStreamResponse }
