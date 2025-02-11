import { type ChatBody, type Conversation } from '~/types/chat'
import {
  BedrockModelID,
  BedrockModels,
  type BedrockModel,
} from '~/utils/modelProviders/types/bedrock'
import {
  BedrockProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { type CoreMessage, generateText, streamText } from 'ai'
import { bedrock } from '@ai-sdk/amazon-bedrock'
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

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const client = bedrock({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    }
  })

  const model = client(conversation.model.id)
  const messages = convertConversationToBedrockFormat(conversation)

  const commonParams = {
    model,
    messages,
    temperature: conversation.temperature || 0.7,
    maxTokens: 4096,
  }

  if (stream) {
    const result = await streamText(commonParams)
    return result.toTextStreamResponse()
  } else {
    const result = await generateText(commonParams)
    return { choices: [{ message: { content: result.text } }] }
  }
}

function convertConversationToBedrockFormat(conversation: Conversation) {
  const messages = []

  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    messages.push({
      role: 'assistant',
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

    messages.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: content,
    })
  })

  return messages
}

export async function GET(req: Request) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION

  if (!accessKeyId || !secretAccessKey || !region) {
    return NextResponse.json(
      { error: 'AWS credentials not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(BedrockModels) as BedrockModel[]

  return NextResponse.json({
    provider: ProviderNames.Bedrock,
    models: models,
  })
} 