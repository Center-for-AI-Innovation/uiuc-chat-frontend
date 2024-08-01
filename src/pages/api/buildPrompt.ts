// src/pages/api/chat.ts
import { CourseMetadata } from '~/types/courseMetadata'
import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import {
  ChatBody,
  Content,
  ContextWithMetadata,
  Conversation,
  MessageType,
  OpenAIChatMessage,
  ToolOutput,
  UIUCTool,
} from '@/types/chat'
import { NextResponse } from 'next/server'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { buildPrompt } from './chat'

export const config = {
  runtime: 'edge',
}

// A POST request endpoint that just calls buildPrompt and returns that as a json body.
export default async (req: Request): Promise<NextResponse> => {
  try {
    const { conversation, key, course_name, courseMetadata } =
      (await req.json()) as ChatBody

    console.log('In build prompt fetch endpoint!!')

    if (!conversation) {
      console.error('No conversation provided')
      return new NextResponse(
        JSON.stringify({ error: 'No conversation provided' }),
        { status: 400 },
      )
    }

    const updatedConversation = await buildPrompt({
      conversation,
      projectName: course_name,
      courseMetadata,
    })

    return new NextResponse(JSON.stringify(updatedConversation))
  } catch (error) {
    console.error('Error in buildPromptAPI:', error)
    return new NextResponse(JSON.stringify({ error: (error as Error).message }))
  }
}
