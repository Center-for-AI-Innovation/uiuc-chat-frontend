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
  const startTime = Date.now()

  try {
    const body = await req.json()

    const { conversation, course_name, courseMetadata, mode } = body as ChatBody

    const buildPromptStartTime = Date.now()
    const newConversation = await buildPrompt({
      conversation,
      projectName: course_name,
      courseMetadata,
      mode,
    })
    const buildPromptEndTime = Date.now()
    const buildPromptDuration = buildPromptEndTime - buildPromptStartTime
    console.log(`buildPrompt duration: ${buildPromptDuration}ms`)

    body.conversation = newConversation
    const result = await routeModelRequest(body as ChatBody)
    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`Total duration: ${duration}ms`)
    return result
  } catch (error) {
    console.error('Error in routeModelRequest:', error)

    let errorMessage = 'An unexpected error occurred'
    let statusCode = 500

    if (error instanceof OpenAIError) {
      const parsedCode = parseInt(error.code || '500')
      statusCode = parsedCode >= 200 && parsedCode <= 599 ? parsedCode : 500
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: statusCode,
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
