import { type CoreMessage, generateText, streamText } from 'ai'
import { type ChatBody, type Conversation } from '~/types/chat'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import {
  BedrockModels,
  type BedrockModel,
} from '~/utils/modelProviders/types/bedrock'
import {
  BedrockProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
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

  const bedrock = createAmazonBedrock({
    accessKeyId: await decryptKeyIfNeeded(bedrockProvider.accessKeyId),
    secretAccessKey: await decryptKeyIfNeeded(bedrockProvider.secretAccessKey),
    region: bedrockProvider.region,
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const model = bedrock(conversation.model.id)

  const commonParams = {
    model: model,
    messages: convertConversationToBedrockFormat(conversation),
    temperature: conversation.temperature,
    maxTokens: 4096,
  }

  if (stream) {
    const result = await streamText(commonParams)
    //   {
    //   ...commonParams,
    //   messages: commonParams.messages.map(msg => ({
    //     role: msg.role,
    //     content: msg.content,
    //   }))
    // })
    return result.toTextStreamResponse()
  } else {
    const result = await generateText(commonParams)
    const choices = [{ message: { content: result.text } }]
    return { choices }
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
