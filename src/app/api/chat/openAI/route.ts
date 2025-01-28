import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'
import { decrypt } from '~/utils/crypto'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    // let { messages, apiKey } = await req.json()
    // console.log('headers', req.headers);
    // const headers = {
    //   'Content-type': 'application/json;charset=UTF-8',
    //   'Authorization': `Bearer ${apiKey}`,
    // }
    // const openai = new OpenAI({
    //   apiKey: apiKey,
    //   headers: headers,
    // })

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

    // If the key is already in sk- format, use it directly
    if (!apiKey.startsWith('sk-')) {
      try {
        apiKey = (await decrypt(
          apiKey,
          process.env.NEXT_PUBLIC_SIGNING_KEY as string,
        )) as string

        // Double check it's not Vlad's key after decryption
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

    // Final validation that we have a valid key format
    if (!apiKey.startsWith('sk-')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid API key format. OpenAI API keys should start with "sk-". Please check the LLM page in your course settings.' 
      }), {
        status: 401,
      })
    }

    const openai = new OpenAI({
      apiKey,
    })
    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages,
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error
      return NextResponse.json({ name, status, headers, message }, { status })
    } else {
      throw error
    }
  }
}
