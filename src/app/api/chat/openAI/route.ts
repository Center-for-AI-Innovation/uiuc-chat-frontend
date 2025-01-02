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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }
    let apiKey = authHeader.substring(7)
    const { messages } = await req.json()

    if (!apiKey || apiKey == 'undefined') {
      console.debug("KEY IS UNDEFINED, using Vlad's key.")
      apiKey = process.env.VLADS_OPENAI_KEY as string
    }
    if (!apiKey.startsWith('sk')) {
      apiKey = (await decrypt(
        apiKey,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )) as string
      console.debug('apikey', apiKey)
    }

    const openai = new OpenAI({
      apiKey,
    })
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
