import type { Conversation } from '~/types/chat'
import type { BedrockProvider } from '~/utils/modelProviders/LLMProvider'
// Temporarily disabled due to build issues
// import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { type CoreMessage, generateText, streamText } from 'ai'
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

    // Temporarily disabled due to build issues
    throw new Error('AWS Bedrock functionality temporarily disabled')
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
