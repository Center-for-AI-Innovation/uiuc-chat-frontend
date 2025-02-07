import { type CoreMessage } from 'ai'
import { type ChatBody, type Conversation } from '~/types/chat'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { BedrockProvider, ProviderNames } from '~/utils/modelProviders/LLMProvider'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'

export async function runBedrockChat(
  conversation: Conversation,
  bedrockProvider: BedrockProvider,
  stream: boolean,
) {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }

  if (!bedrockProvider.accessKeyId || !bedrockProvider.secretAccessKey || !bedrockProvider.region) {
    throw new Error('AWS credentials are missing')
  }

  const accessKeyId = await decryptKeyIfNeeded(bedrockProvider.accessKeyId)
  const secretAccessKey = await decryptKeyIfNeeded(bedrockProvider.secretAccessKey)
  const region = bedrockProvider.region

  const bedrockClient = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const messages = convertConversationToVercelAISDKv3(conversation)
  const modelId = conversation.model.id

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) {
    throw new Error('No message to send')
  }

  // Format the request based on the model provider
  let requestBody: any = {}
  if (modelId.startsWith('anthropic.')) {
    requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: conversation.temperature,
    }
  } else if (modelId.startsWith('amazon.')) {
    requestBody = {
      inputText: lastMessage.content,
      textGenerationConfig: {
        maxTokenCount: 4096,
        temperature: conversation.temperature,
      },
    }
  } else if (modelId.startsWith('meta.')) {
    requestBody = {
      prompt: lastMessage.content,
      max_gen_len: 4096,
      temperature: conversation.temperature,
    }
  }

  const command = new InvokeModelCommand({
    modelId,
    body: JSON.stringify(requestBody),
    contentType: 'application/json',
    accept: 'application/json',
  })

  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  let content = ''
  if (modelId.startsWith('anthropic.')) {
    content = responseBody.content[0].text
  } else if (modelId.startsWith('amazon.')) {
    content = responseBody.results[0].outputText
  } else if (modelId.startsWith('meta.')) {
    content = responseBody.generation
  }

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain' },
  })
}

export async function POST(req: Request) {
  try {
    const {
      chatBody,
    }: {
      chatBody: ChatBody
    } = await req.json()

    const conversation = chatBody.conversation
    if (!conversation) {
      throw new Error('Conversation is missing from the chat body')
    }

    const bedrockProvider = chatBody.llmProviders?.Bedrock as BedrockProvider
    if (!bedrockProvider) {
      throw new Error('Bedrock provider configuration is missing')
    }

    const response = await runBedrockChat(conversation, bedrockProvider, true)
    return response
  } catch (error) {
    console.error('Bedrock API Error:', error)
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing the chat request',
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
      content +=
        '\n\nIf you use the <Potentially Relevant Documents> in your response, please remember cite your sources using the required formatting, e.g. "The grass is green. [29, page: 11]'
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