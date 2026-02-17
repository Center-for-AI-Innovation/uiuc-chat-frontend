import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, type ModelMessage } from 'ai'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { uiMessageStreamResponseToTextWithThink } from '~/app/utils/streaming/reasoningToThink'
import { decrypt } from '~/utils/crypto'
import { withCourseAccessFromRequest } from '~/app/api/authorization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error:
            'No authorization header found. Please ensure you have added your OpenAI API key on the LLM page in your course settings.',
        },
        { status: 401 },
      )
    }

    let apiKey = authHeader.substring(7)
    const { messages, model = 'gpt-4', stream = true } = await req.json()

    if (
      !apiKey ||
      apiKey === 'undefined' ||
      apiKey === process.env.VLADS_OPENAI_KEY
    ) {
      return NextResponse.json(
        {
          error:
            'Please add your OpenAI API key on the LLM page in your course settings.',
        },
        { status: 401 },
      )
    }

    if (!apiKey.startsWith('sk-')) {
      try {
        apiKey = (await decrypt(
          apiKey,
          process.env.NEXT_PUBLIC_SIGNING_KEY as string,
        )) as string

        if (apiKey === process.env.VLADS_OPENAI_KEY) {
          return NextResponse.json(
            {
              error:
                'Please add your OpenAI API key on the LLM page in your course settings.',
            },
            { status: 401 },
          )
        }
      } catch (error) {
        console.error('Error decrypting OpenAI key:', error)
        return NextResponse.json(
          {
            error:
              'Invalid API key format. Please ensure you have entered a valid OpenAI API key on the LLM page in your course settings.',
          },
          { status: 401 },
        )
      }
    }

    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        {
          error:
            'Invalid API key format. OpenAI API keys should start with "sk-". Please check the LLM page in your course settings.',
        },
        { status: 401 },
      )
    }

    const openAIClient = createOpenAI({
      apiKey,

      // Default OpenAI API URL
      baseURL: 'https://api.openai.com/v1',
    })

    const openAIModel = openAIClient.responses(model)

    const commonParams: Record<string, unknown> = {
      model: openAIModel,
      messages: messages as ModelMessage[],
      maxOutputTokens: 8192,
    }
    if (supportsTemperature(model)) {
      commonParams.temperature = 0.7
    } else {
      commonParams.providerOptions = { openai: { reasoningSummary: 'auto' } }
    }

    if (stream) {
      const result = streamText(commonParams as any)
      const uiResponse = result.toUIMessageStreamResponse({
        sendReasoning: true,
        onError: () => `An error occurred while streaming the response.`,
      })
      const textResponse = uiMessageStreamResponseToTextWithThink(uiResponse)
      return new NextResponse(textResponse.body, {
        status: textResponse.status,
        headers: textResponse.headers,
      })
    } else {
      const result = await generateText(commonParams as any)
      const formatted =
        result.reasoningText && result.reasoningText.length > 0
          ? `<think>${result.reasoningText}</think>\n${result.text}`
          : result.text
      return NextResponse.json({
        choices: [{ message: { content: formatted } }],
      })
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

export const POST = withCourseAccessFromRequest('any')(handler)

function supportsTemperature(modelId: string): boolean {
  const id = modelId.toLowerCase()
  if (id.startsWith('gpt-5')) return false
  if (id.startsWith('o')) return false
  return true
}
