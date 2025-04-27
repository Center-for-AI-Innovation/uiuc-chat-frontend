import { type CoreMessage, generateText, streamText, smoothStream } from 'ai'
import { type Conversation } from '~/types/chat'
import { createAnthropic } from '@ai-sdk/anthropic'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { AnthropicModel } from '~/utils/modelProviders/types/anthropic'
import { convertConversationToVercelAISDKv3 } from '~/utils/apiUtils'
export const dynamic = 'force-dynamic'

/**
 * Runs an Anthropic chat with the given conversation and API provider
 * Handles extended thinking mode if enabled on the selected model
 * Outputs thinking content in <think> tags when streaming and model supports it
 */
export async function runAnthropicChat(
  conversation: Conversation,
  anthropicProvider: AnthropicProvider,
  stream = true,
): Promise<Response> {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }
  if (!anthropicProvider.apiKey) {
    throw new Error('Anthropic API key is missing')
  }
  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const anthropic = createAnthropic({
    apiKey: await decryptKeyIfNeeded(anthropicProvider.apiKey),
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  // Check if the model is an Anthropic model and has extended thinking enabled
  const isAnthropicModelWithThinking =
    conversation.model &&
    'extendedThinking' in conversation.model &&
    (conversation.model as AnthropicModel).extendedThinking === true

  // Remove the -thinking suffix for the actual API call
  const modelId = isAnthropicModelWithThinking
    ? conversation.model.id.replace('-thinking', '')
    : conversation.model.id

  const model = anthropic(modelId)

  // Common parameters for both streaming and non-streaming requests
  const commonParams = {
    model: model,
    messages: convertConversationToVercelAISDKv3(conversation),
    temperature: conversation.temperature,
    maxTokens: 4096,
    ...(isAnthropicModelWithThinking && {
      providerOptions: {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: 16000, // Default budget for extended thinking
          },
        },
      },
    }),
  }

  if (stream) {
    return handleStreamingResponse(commonParams, isAnthropicModelWithThinking)
  } else {
    return handleNonStreamingResponse(
      commonParams,
      isAnthropicModelWithThinking,
    )
  }
}

/**
 * Handles streaming response with thinking content processing
 */
async function handleStreamingResponse(
  commonParams: any,
  isThinkingEnabled: boolean,
): Promise<Response> {  
  const result = await streamText({
    ...commonParams,
    experimental_transform: [
      smoothStream({
        chunking: 'word',
      }),
    ],
  })

  if (!isThinkingEnabled) {
    return result.toTextStreamResponse()
  }

  // Get the original stream response
  const originalResponse = result.toDataStreamResponse({
    sendReasoning: true,
    getErrorMessage: () => {
      return `An error occurred while streaming the response.`
    },
  })

  // Create new headers with content type text/plain
  const responseHeaders = new Headers(originalResponse.headers)
  responseHeaders.set('Content-Type', 'text/plain; charset=utf-8')

  // Create a new response with transformed data for thinking-enabled models
  return new Response(
    new ReadableStream({
      async start(controller) {
        const reader = originalResponse.body?.getReader()

        if (!reader) {
          controller.close()
          return
        }

        const textDecoder = new TextDecoder()

        try {
          let isThinkingOpen = false
          let currentThinking = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              // Final output for any remaining content
              if (isThinkingOpen && currentThinking) {
                controller.enqueue(
                  new TextEncoder().encode(`${currentThinking}</think>`),
                )
              }
              controller.close()
              break
            }

            const text = textDecoder.decode(value)

            // Process each line of the incoming text
            const lines = text.split('\n')
            let outputBuffer = ''

            // Detect content types present in this chunk
            let hasThinking = false
            let hasRegular = false
            let hasThinkingEnd = false

            for (const line of lines) {
              if (!line.trim()) continue

              if (line.startsWith('g:')) hasThinking = true
              if (line.startsWith('0:')) hasRegular = true
              if (line.startsWith('j:')) hasThinkingEnd = true
            }

            // Process thinking content (g: lines)
            if (hasThinking) {
              for (const line of lines) {
                if (!line.trim() || !line.startsWith('g:')) continue

                const rawContent = line.slice(2).trim()
                let parsedContent = ''

                try {
                  if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
                    parsedContent = JSON.parse(rawContent)
                  } else {
                    parsedContent = rawContent
                  }
                  currentThinking += parsedContent
                } catch (error) {
                  // Fallback for parsing errors
                  if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
                    parsedContent = rawContent.slice(1, -1)
                  } else {
                    parsedContent = rawContent
                  }
                  currentThinking += parsedContent
                }
              }

              // Open thinking tag if not already open
              if (!isThinkingOpen && currentThinking.length > 0) {
                outputBuffer += `<think>${currentThinking}`
                isThinkingOpen = true
                currentThinking = ''
              }
              // If tag is already open, just stream the content
              else if (isThinkingOpen && currentThinking.length > 0) {
                outputBuffer += currentThinking
                currentThinking = ''
              }
            }

            // Process end of thinking marker (j: lines)
            if (hasThinkingEnd && isThinkingOpen) {
              outputBuffer += '</think>'
              isThinkingOpen = false
            }

            // Process regular content (0: lines)
            if (hasRegular) {
              // If we still have an open thinking tag, close it
              if (isThinkingOpen) {
                outputBuffer += '</think>'
                isThinkingOpen = false
              }

              // Extract and process regular content
              let regularContent = ''
              for (const line of lines) {
                if (!line.trim() || !line.startsWith('0:')) continue

                const rawContent = line.slice(2).trim()
                let parsedContent = ''

                try {
                  if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
                    parsedContent = JSON.parse(rawContent)
                  } else {
                    parsedContent = rawContent
                  }
                  regularContent += parsedContent
                } catch (error) {
                  // Fallback for parsing errors
                  if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
                    parsedContent = rawContent.slice(1, -1)
                  } else {
                    parsedContent = rawContent
                  }
                  regularContent += parsedContent
                }
              }

              // Add regular content to output buffer
              if (regularContent.length > 0) {
                outputBuffer += regularContent
              }
            }

            // Send output if we have any
            if (outputBuffer.length > 0) {
              controller.enqueue(new TextEncoder().encode(outputBuffer))
            }
          }
        } catch (error) {
          console.error('Error processing stream:', error)
          controller.error(error)
        }
      },
    }),
    {
      headers: responseHeaders,
      status: originalResponse.status,
      statusText: originalResponse.statusText,
    },
  )
}

/**
 * Handles non-streaming (regular) response
 */
async function handleNonStreamingResponse(
  commonParams: any,
  isThinkingEnabled: boolean,
): Promise<Response> {
  if (isThinkingEnabled) {
    const { text, reasoning } = await generateText({
      ...commonParams,
    })

    // Format the response with reasoning wrapped in <think> tags at the beginning
    const formattedContent = reasoning
      ? `<think>${reasoning}</think>\n${text}`
      : text

    return new Response(
      JSON.stringify({ choices: [{ message: { content: formattedContent } }] }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const result = await generateText({
    ...commonParams,
  })

  return new Response(
    JSON.stringify({ choices: [{ message: { content: result.text } }] }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
