import OpenAI from 'openai'
import { type CoreMessage, generateText, streamText } from 'ai'
import { NextResponse } from 'next/server'
import { decrypt } from '~/utils/crypto'
import { createOpenAI } from '@ai-sdk/openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error:
            'No authorization header found. Please ensure you have added your OpenAI API key on the LLM page in your course settings.',
        }),
        {
          status: 401,
        },
      )
    }

    let apiKey = authHeader.substring(7)
    const { messages, model = 'gpt-4', stream = true } = await req.json()

    if (
      !apiKey ||
      apiKey === 'undefined' ||
      apiKey === process.env.VLADS_OPENAI_KEY
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Please add your OpenAI API key on the LLM page in your course settings.',
        }),
        {
          status: 401,
        },
      )
    }

    if (!apiKey.startsWith('sk-')) {
      try {
        apiKey = (await decrypt(
          apiKey,
          process.env.NEXT_PUBLIC_SIGNING_KEY as string,
        )) as string

        if (apiKey === process.env.VLADS_OPENAI_KEY) {
          return new Response(
            JSON.stringify({
              error:
                'Please add your OpenAI API key on the LLM page in your course settings.',
            }),
            {
              status: 401,
            },
          )
        }
      } catch (error) {
        console.error('Error decrypting OpenAI key:', error)
        return new Response(
          JSON.stringify({
            error:
              'Invalid API key format. Please ensure you have entered a valid OpenAI API key on the LLM page in your course settings.',
          }),
          {
            status: 401,
          },
        )
      }
    }

    if (!apiKey.startsWith('sk-')) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid API key format. OpenAI API keys should start with "sk-". Please check the LLM page in your course settings.',
        }),
        {
          status: 401,
        },
      )
    }

    const openAIClient = createOpenAI({
      apiKey,
      baseURL: 'https://api.openai.com/v1', // Default OpenAI API URL
      compatibility: 'strict', // Use strict mode for OpenAI API
    })

    const openAIModel = openAIClient(model)

    const commonParams = {
      model: openAIModel,
      messages: messages as CoreMessage[],
      temperature: 0.7, // You might want to make this configurable
      maxTokens: 8192,
    }

    if (stream) {
      const result = await streamText(commonParams as any)
      return result.toTextStreamResponse()
    } else {
      const result = await generateText(commonParams as any)
      return new Response(
        JSON.stringify({ choices: [{ message: { content: result.text } }] }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error
      return NextResponse.json({ name, status, headers, message }, { status })
    } else {
      throw error
    }
  }
}
