import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { type NCSAHostedVLMProvider } from '~/utils/modelProviders/LLMProvider'
import { convertConversationToVercelAISDKv3 } from '~/utils/apiUtils'
export const dynamic = 'force-dynamic'

import { createOpenAI } from '@ai-sdk/openai'

export async function runVLLM(
  conversation: Conversation,
  ncsaHostedVLMProvider: NCSAHostedVLMProvider,
  stream: boolean,
) {
  try {
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

    try {
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
    } catch (error) {
      console.error('VLLM API error:', error)
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error(`VLLM request timed out: ${error.message}`)
      } else if (error instanceof Error && error.message.includes('apiKey')) {
        throw new Error(`VLLM authentication error: Please check API configuration`)
      } else {
        throw error // rethrow the original error with context
      }
    }
  } catch (error) {
    console.error('Error in runVLLM:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred when running VLLM',
        detailed_error: error instanceof Error ? error.toString() : 'Unknown error',
        source: 'VLLM',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
