// src/app/api/allNewRoutingChat/route.ts

import { ChatBody, Conversation } from '@/types/chat'
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
  const { searchParams } = new URL(req.url)
  const summary = searchParams.get('summary') === 'true'

  try {
    const body = await req.json()
    const { conversation, course_name, courseMetadata, mode } = body as ChatBody

    const buildPromptStartTime = Date.now()
    let newConversation: Conversation

    if (summary) {
      // call LLM for summarized conversation
      newConversation = await buildPrompt({
        conversation,
        projectName: course_name,
        courseMetadata,
        summary: true,
        mode,
      })
    } else {
      // normal flow without summary
      newConversation = await buildPrompt({
        conversation,
        projectName: course_name,
        courseMetadata,
        summary: false,
        mode,
      })
    }
    const buildPromptEndTime = Date.now()
    const buildPromptDuration = buildPromptEndTime - buildPromptStartTime
    console.log(`buildPrompt duration: ${buildPromptDuration}ms`)

    body.conversation = newConversation
    const result = await routeModelRequest(body as ChatBody)

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
