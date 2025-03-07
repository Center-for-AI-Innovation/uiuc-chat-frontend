// src/app/api/allNewRoutingChat/route.ts

import { ChatBody } from '@/types/chat'
import { routeModelRequest } from '~/utils/streamProcessing'
import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { OpenAIError } from '~/utils/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const body = await req.json()
    const { conversation, course_name, courseMetadata, mode } = body as ChatBody

    // Build the prompt
    const newConversation = await buildPrompt({
      conversation,
      projectName: course_name,
      courseMetadata,
      mode,
    })

    body.conversation = newConversation
    const result = await routeModelRequest(body as ChatBody)

    // Handle empty response case
    if (result instanceof Response) {
      const responseClone = result.clone()
      try {
        const responseText = await responseClone.text()

        if (!responseText || responseText.trim() === '') {
          return Response.json(
            {
              title: 'LLM Didn\'t Respond',
              message: 'The LLM might be overloaded or misconfigured. Please check your API key, or use a different LLM.',
            },
            { status: 500 }
          )
        }

        // Return a new response with the same content
        return new Response(responseText, {
          status: result.status,
          statusText: result.statusText,
          headers: result.headers
        })
      } catch (error) {
        // If we can't read the response, return the original
        return result
      }
    }

    return result
  } catch (error) {
    console.error('Error in route handler:', error)

    // For errors that occur before calling routeModelRequest
    return new Response(
      JSON.stringify({
        title: 'LLM Error',
        message: error instanceof Error
          ? error.message
          : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
