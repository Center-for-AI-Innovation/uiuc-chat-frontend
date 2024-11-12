import { ChatBody } from '@/types/chat'
import { routeModelRequest } from '~/utils/streamProcessing'
import { NextRequest, NextResponse } from 'next/server'

import { buildPrompt } from '~/app/utils/buildPromptUtils'

export async function POST(req: NextRequest, res: NextResponse) {
  const startTime = Date.now()

  const body = await req.json()

  const {
    conversation,
    key,
    course_name,
    courseMetadata,
    stream,
    llmProviders,
  } = body as ChatBody

  const buildPromptStartTime = Date.now()
  const newConversation = await buildPrompt({
    conversation,
    projectName: course_name,
    courseMetadata,
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
}
