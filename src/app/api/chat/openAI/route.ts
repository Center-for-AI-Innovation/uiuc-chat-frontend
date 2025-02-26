import OpenAI from 'openai'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { NextResponse } from 'next/server'
import { decrypt } from '~/utils/crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'No authorization header found. Please ensure you have added your OpenAI API key on the LLM page in your course settings.'
      }), {
        status: 401,
      })
    }

    let apiKey = authHeader.substring(7)
    const { messages, model = 'gpt-4o' } = await req.json()

    if (!apiKey || apiKey === 'undefined' || apiKey === process.env.VLADS_OPENAI_KEY) {
      return new Response(JSON.stringify({
        error: 'Please add your OpenAI API key on the LLM page in your course settings.'
      }), {
        status: 401,
      })
    }

    if (!apiKey.startsWith('sk-')) {
      try {
        apiKey = (await decrypt(
          apiKey,
          process.env.NEXT_PUBLIC_SIGNING_KEY as string,
        )) as string

        if (apiKey === process.env.VLADS_OPENAI_KEY) {
          return new Response(JSON.stringify({
            error: 'Please add your OpenAI API key on the LLM page in your course settings.'
          }), {
            status: 401,
          })
        }
      } catch (error) {
        console.error('Error decrypting OpenAI key:', error)
        return new Response(JSON.stringify({
          error: 'Invalid API key format. Please ensure you have entered a valid OpenAI API key on the LLM page in your course settings.'
        }), {
          status: 401,
        })
      }
    }

    if (!apiKey.startsWith('sk-')) {
      return new Response(JSON.stringify({
        error: 'Invalid API key format. OpenAI API keys should start with "sk-". Please check the LLM page in your course settings.'
      }), {
        status: 401,
      })
    }

    const openaiProvider = createOpenAI({
      apiKey
    })


    const result = streamText({
      model: openaiProvider(model),
      messages
    })

    return new Response(await result.text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error
      return NextResponse.json({ name, status, headers, message }, { status })
    } else {
      throw error
    }
  }
}
