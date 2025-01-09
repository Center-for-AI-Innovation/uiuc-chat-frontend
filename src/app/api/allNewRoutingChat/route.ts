// src/app/api/allNewRoutingChat/route.ts

import { ChatBody } from '@/types/chat'
import { routeModelRequest } from '~/utils/streamProcessing'
import { NextRequest, NextResponse } from 'next/server'

import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { OpenAIError } from '~/utils/server'

export async function POST(req: NextRequest, res: NextResponse) {
  const startTime = Date.now()

  const body = await req.json()

  const {
    conversation,
    // key,
    course_name,
    courseMetadata,
    // stream,
    // llmProviders,
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

  // Log the final state before sending to model
  const lastMessage = newConversation.messages[newConversation.messages.length - 1]
  console.log('Final conversation state before model request:', {
    systemPrompt: lastMessage?.latestSystemMessage,
    userPrompt: lastMessage?.finalPromtEngineeredMessage,
    courseSettings: {
      documentsOnly: courseMetadata?.documentsOnly,
      systemPromptOnly: courseMetadata?.systemPromptOnly,
      guidedLearning: courseMetadata?.guidedLearning
    },
    model: newConversation.model.id,
    temperature: newConversation.temperature
  });

  try {
    const result = await routeModelRequest(body as ChatBody)

    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`Total duration: ${duration}ms`)

    return result
  } catch (error) {
    console.error('Error in chat route:', error)

    let errorMessage = 'An unexpected error occurred'
    let statusCode = 500

    if (error instanceof OpenAIError) {
      statusCode = parseInt(error.code || '500')
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
