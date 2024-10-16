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
import { convertConversatonToVercelAISDKv3 } from '~/utils/apiUtils'

// export const runtime = 'edge' // Does NOT work
export const dynamic = 'force-dynamic' // known bug with Vercel: https://sdk.vercel.ai/docs/troubleshooting/common-issues/streaming-not-working-on-vercel
export const maxDuration = 60

export async function POST(req: Request) {
  /*
  Run Ollama chat, given a text string. Return a streaming response promise.
  */

  const {
    conversation,
    ollamaProvider,
    stream,
  }: {
    conversation: Conversation
    ollamaProvider: OllamaProvider | NCSAHostedProvider
    stream: boolean
  } = await req.json()
  if (!ollamaProvider.baseUrl || ollamaProvider.baseUrl === '') {
    ollamaProvider.baseUrl = process.env.OLLAMA_SERVER_URL
  }

  const ollama = createOllama({
    baseURL: `${(await decryptKeyIfNeeded(ollamaProvider!.baseUrl!)) as any}/api`,
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  if (stream) {
    const result = await streamText({
      model: ollama(conversation.model.id) as any,
      messages: convertConversatonToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxTokens: 4096, // output tokens
    })
    return result.toTextStreamResponse()
  } else {
    const result = await generateText({
      model: ollama(conversation.model.id) as any,
      messages: convertConversatonToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxTokens: 4096, // output tokens
    })
    // console.log('result.response', result)
    const choices = [{ message: { content: result.text } }]
    const response = { choices: choices }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
