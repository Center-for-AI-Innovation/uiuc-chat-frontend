import { type CoreMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import {
  BedrockModels,
  type BedrockModel,
} from '~/utils/modelProviders/types/bedrock'
import {
  type BedrockProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextResponse } from 'next/server'

export async function runBedrockChat(
  conversation: Conversation,
  bedrockProvider: BedrockProvider,
  stream: boolean,
) {
  try {
    if (!conversation) {
      throw new Error('Conversation is missing - please refresh the page')
    }

    if (
      !bedrockProvider.accessKeyId ||
      !bedrockProvider.secretAccessKey ||
      !bedrockProvider.region
    ) {
      throw new Error(
        'AWS credentials are missing - please refresh the page, or add credentials in the Admin Dashboard',
      )
    }

    const bedrock = createAmazonBedrock({
      bedrockOptions: {
        region: bedrockProvider.region,
        credentials: {
          accessKeyId: await decryptKeyIfNeeded(bedrockProvider.accessKeyId),
          secretAccessKey: await decryptKeyIfNeeded(
            bedrockProvider.secretAccessKey,
          ),
          sessionToken: undefined,
        },
      },
    })

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }
    const commonParams = {
      model: bedrock(conversation.model.id),
      messages: convertConversationToBedrockFormat(conversation),
      temperature: conversation.temperature,
      maxTokens: 4096,
      type: 'text-delta' as const,
      tools: {},
      toolChoice: undefined,
    }

    if (stream) {
      const result = await streamText({
        ...commonParams,
        messages: commonParams.messages.map((msg) => ({
          role: msg.role === 'tool' ? 'tool' : msg.role,
          content: msg.content,
        })) as CoreMessage[],
      })
      return result.toTextStreamResponse()
    } else {
      const result = await generateText(commonParams)
      const choices = [{ message: { content: result.text } }]
      return NextResponse.json({ choices })
    }
  } catch (error) {
    console.error('Error in runBedrockChat:', error)
    throw error
  }
}

function convertConversationToBedrockFormat(
  conversation: Conversation,
): CoreMessage[] {
  const messages = []
  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    messages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') {
      return
    }

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

    messages.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: content,
    })
  })
  return messages as CoreMessage[]
}

export async function GET(req: Request) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION

  if (!accessKeyId || !secretAccessKey || !region) {
    return NextResponse.json(
      { error: 'Bedrock credentials not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(BedrockModels) as BedrockModel[]

  return NextResponse.json({
    provider: ProviderNames.Bedrock,
    models: models,
  })
}
