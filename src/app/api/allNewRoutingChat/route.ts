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

  const body = await req.json()

  try {
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
    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`Total duration: ${duration}ms`)
    return result

  } catch (error) {
    console.error('Error in routeModelRequest:', error)

    let errorMessage = 'An unexpected error occurred'
    let statusCode = 500
    if (error instanceof OpenAIError) {
      statusCode = parseInt(error.code || '500')
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
  }

}
