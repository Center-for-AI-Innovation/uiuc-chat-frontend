import { generateText, streamText } from 'ai'
import { type ChatBody } from '~/types/chat'
import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { convertConversationToCoreMessagesWithoutSystem } from '~/utils/apiUtils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { chatBody, stream }: { chatBody: ChatBody; stream?: boolean } = await req.json()

    console.log('chatBody: ', chatBody)

    const conversation = chatBody.conversation
    if (!conversation) {
      throw new Error('Conversation is missing from the chat body')
    }

    const apiKey = chatBody.llmProviders?.Azure?.apiKey
    if (!apiKey) {
      throw new Error('Azure API key is missing')
    }

    const openai = createOpenAI({
      apiKey,
      baseURL: process.env.AZURE_OPENAI_API_BASE_URL,
      compatibility: 'compatible',
    })

    const messages = convertConversationToCoreMessagesWithoutSystem(conversation)
    
    if (stream) {
      const result = await streamText({
        model: openai(conversation.model.id) as any,
        messages,
        temperature: conversation.temperature,
      })
      return result.toTextStreamResponse()
    } else {
      const result = await generateText({
        model: openai(conversation.model.id) as any,
        messages,
        temperature: conversation.temperature,
      })
      return NextResponse.json({ text: result.text })
    }
  } catch (error) {
    console.error('Error in POST request:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 }
      )
    }
  }
} 