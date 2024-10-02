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
    const body = await req.json();

    const { conversation, key, course_name, courseMetadata } = body as ChatBody;

    if (!conversation) {
      console.error('No conversation provided');
      return new NextResponse(
        JSON.stringify({ error: 'No conversation provided' }),
        { status: 400 },
      )
    }

    if (!conversation.messages || !Array.isArray(conversation.messages)) {
      console.error('Invalid or missing messages in conversation');
      return new NextResponse(
        JSON.stringify({ error: 'Invalid conversation structure' }),
        { status: 400 },
      )
    }

    try {
      const updatedConversation = await buildPrompt({
        conversation,
        projectName: course_name,
        courseMetadata,
      })


      return new NextResponse(JSON.stringify(updatedConversation))
    } catch (buildPromptError) {
      console.error('Error in buildPrompt function:', buildPromptError);
      return new NextResponse(
        JSON.stringify({ error: 'Error in buildPrompt function', details: (buildPromptError as Error).message }),
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Detailed error in buildPromptAPI:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new NextResponse(JSON.stringify({ error: 'An error occurred in buildPromptAPI', details: (error as Error).message }), { status: 500 })
  }
}
