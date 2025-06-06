import { generateText, streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { convertConversationToCoreMessagesWithoutSystem } from '~/utils/apiUtils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { conversation, stream } = await req.json()

    console.log('In POST handler for VLM', conversation.messages[0].content)

    const openai = createOpenAI({
      baseURL: process.env.NCSA_HOSTED_VLM_BASE_URL,
      apiKey: 'non-empty',
      compatibility: 'compatible', // strict/compatible - enable 'strict' when using the OpenAI API
    })

    const messages =
      convertConversationToCoreMessagesWithoutSystem(conversation)
    // const messages = convertToCoreMessages(conversation)
    console.log('⭐️ messages', JSON.stringify(messages, null, 2))

    if (stream) {
      const result = await streamText({
        model: openai(conversation.model.id) as any,
        temperature: conversation.temperature,
        messages,
      })
      return result.toTextStreamResponse()
    } else {
      const result = await generateText({
        model: openai(conversation.model.id) as any,
        temperature: conversation.temperature,
        messages,
      })
      const choices = [{ message: { content: result.text } }]
      return NextResponse.json({ choices })
    }
  } catch (error) {
    console.error('Error in POST request:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 },
      )
    }
  }
}
