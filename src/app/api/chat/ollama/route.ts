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
      model: ollama(conversation.model.id),
      messages: convertConversatonToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxTokens: 4096, // output tokens
    })
    return result.toTextStreamResponse()
  } else {
    const result = await generateText({
      model: ollama(conversation.model.id),
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

export async function GET(req: Request) {
  /*
  NOT WORKING YET... need post endpoint
  req: Request
  Get all available models from Ollama 
  For ollama, use the endpoint GET /api/ps to see which models are "hot", save just the name and the parameter_size.
  */
  const url = new URL(req.url)
  const ollamaProvider = JSON.parse(
    url.searchParams.get('ollamaProvider') || '{}',
  ) as OllamaProvider

  const ollamaNames = new Map([['llama3.1:70b', 'Llama 3.1 70b']])

  try {
    if (!ollamaProvider.baseUrl) {
      return new Response(
        JSON.stringify({
          error: `Ollama baseurl not defined: ${ollamaProvider.baseUrl}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const response = await fetch(ollamaProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `HTTP error! status: ${response.status}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      .filter((model: any) => model.name.includes('llama3.1:70b'))
      .map(
        (model: any): OllamaModel => ({
          id: model.name,
          name: ollamaNames.get(model.name) || model.name,
          parameterSize: model.details.parameter_size,
          tokenLimit: 4096,
          enabled: true,
        }),
      )

    return new Response(JSON.stringify(ollamaModels), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
