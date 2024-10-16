import { convertToCoreMessages, generateText, streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { convertConversatonToLlamaVisionNoSystemMessage } from '~/utils/apiUtils'

export async function POST(req: Request) {
  try {
    const { conversation, stream } = await req.json()

    console.log('In POST handler for VLLM', conversation.messages[0].content)

    const openai = createOpenAI({
      baseURL: process.env.NCSA_HOSTED_VLLM_BASE_URL,
      apiKey: 'non-empty',
      compatibility: 'compatible', // strict/compatible - enable 'strict' when using the OpenAI API
    })

    const messages =
      convertConversatonToLlamaVisionNoSystemMessage(conversation)
    // const messages = convertToCoreMessages(conversation)
    console.log('⭐️ messages', JSON.stringify(messages, null, 2))

    if (stream) {
      const result = await streamText({
        model: openai('meta-llama/Llama-3.2-11B-Vision-Instruct'),
        temperature: conversation.temperature,
        messages,
      })
      return result.toTextStreamResponse()
    } else {
      const result = await generateText({
        model: openai('meta-llama/Llama-3.2-11B-Vision-Instruct'),
        messages,
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
        { status: 500 },
      )
    }
  }
}
