// src/app/api/agent/route.ts
// Server-side agent streaming endpoint for agent mode

import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { type AuthenticatedRequest, getUserIdentifier } from '~/utils/appRouterAuth'
import {
  withCourseAccessFromRequest,
  getCourseMetadata,
} from '~/app/api/authorization'
import {
  type AgentRunRequest,
  type AgentStreamEvent,
  serializeAgentStreamEvent,
} from '~/types/agentStream'
import { type Conversation, type Message, type Content } from '~/types/chat'
import { runAgentConversation } from '~/server/agent/runAgentConversation'
import {
  AllSupportedModels,
  type GenericSupportedModel,
  type AllLLMProviders,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import {
  db,
  conversations as conversationsTable,
  messages,
} from '~/db/dbClient'
import { eq } from 'drizzle-orm'
import {
  convertDBToChatConversation,
  type DBMessage,
} from '~/pages/api/conversation'
import { getModels } from '~/pages/api/models'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
// Allow long-running agent operations
export const maxDuration = 300 // 5 minutes

/**
 * Validate that the model is not a WebLLM model (which only runs in browser)
 */
function validateModelForAgentMode(modelId: string): {
  valid: boolean
  error?: string
} {
  const isWebLLMModel = webLLMModels.some((model) => model.id === modelId)
  if (isWebLLMModel) {
    return {
      valid: false,
      error: `WebLLM models cannot be used in Agent Mode. WebLLM models run in the browser and are not compatible with server-side agent orchestration. Please select a server-hosted model.`,
    }
  }
  return { valid: true }
}

// getCourseMetadata is imported from authorization.ts - uses Redis directly
// getModels is imported from pages/api/models.ts - uses Redis directly, no HTTP call needed

/**
 * Fetch or create a conversation
 */
async function getOrCreateConversation(
  conversationId: string | undefined,
  modelId: string,
  projectName: string,
  userIdentifier: string,
  systemPrompt: string,
  temperature: number,
): Promise<Conversation | null> {
  if (conversationId) {
    try {
      // Fetch existing conversation from database
      const dbConversations = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.id, conversationId))
        .limit(1)

      if (dbConversations.length > 0) {
        const dbConv = dbConversations[0]!
        // Fetch messages
        const dbMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversation_id, conversationId))

        return convertDBToChatConversation(
          dbConv,
          dbMessages as unknown as DBMessage[],
        )
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  // Create new conversation
  const model = Array.from(AllSupportedModels).find(
    (m) => m.id === modelId,
  ) as GenericSupportedModel
  if (!model) {
    console.error(`Model ${modelId} not found`)
    return null
  }

  const newConversation: Conversation = {
    id: conversationId || uuidv4(),
    name: 'New Conversation',
    messages: [],
    model,
    prompt: systemPrompt || '',
    temperature: temperature ?? 0.7,
    folderId: null,
    userEmail: userIdentifier,
    projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentModeEnabled: true,
  }

  return newConversation
}

/**
 * Get OpenAI key from providers
 */
function getOpenAIKey(
  llmProviders: AllLLMProviders | null,
  courseMetadata: any,
): string {
  // Try to get from providers
  if (llmProviders?.[ProviderNames.OpenAI]?.apiKey) {
    return llmProviders[ProviderNames.OpenAI].apiKey
  }

  // Try from course metadata
  if (courseMetadata?.openai_api_key) {
    return courseMetadata.openai_api_key
  }

  // Fallback to env
  return process.env.VLADS_OPENAI_KEY || ''
}

async function handler(req: AuthenticatedRequest) {
  try {
    const body: AgentRunRequest = await req.json()
    const {
      conversationId,
      courseName,
      userMessage,
      documentGroups,
      model,
      temperature,
      systemPrompt,
      fileUploadContexts,
    } = body

    // Get user identifier from request
    const userIdentifier = getUserIdentifier(req) || ''

    // Basic validation only - do heavy setup inside stream for faster feedback
    if (!courseName) {
      return NextResponse.json(
        { error: 'courseName is required' },
        { status: 400 },
      )
    }

    if (!userMessage || !userMessage.id || !userMessage.content) {
      return NextResponse.json(
        { error: 'userMessage with id and content is required' },
        { status: 400 },
      )
    }

    if (!model?.id) {
      return NextResponse.json(
        { error: 'model.id is required' },
        { status: 400 },
      )
    }

    // Validate model is not WebLLM
    const modelValidation = validateModelForAgentMode(model.id)
    if (!modelValidation.valid) {
      return NextResponse.json(
        { error: modelValidation.error },
        { status: 400 },
      )
    }

    const encoder = new TextEncoder()
    let controllerClosed = false

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: AgentStreamEvent) => {
          if (controllerClosed) {
            return
          }
          try {
            const serialized = serializeAgentStreamEvent(event)
            controller.enqueue(encoder.encode(serialized))
          } catch (error) {
            if ((error as any).code === 'ERR_INVALID_STATE') {
              controllerClosed = true
              return
            }
            console.error('Error emitting event:', error)
          }
        }

        emit({
          type: 'initializing',
          messageId: userMessage.id,
          conversationId: conversationId,
        })

        try {
          console.log('[Agent Route] Fetching metadata for course:', courseName)
          const [llmProviders, courseMetadata] = await Promise.all([
            getModels(courseName),
            getCourseMetadata(courseName),
          ])

          console.log(
            '[Agent Route] Course metadata result:',
            courseMetadata ? 'found' : 'not found',
          )
          console.log(
            '[Agent Route] LLM providers result:',
            llmProviders ? 'found' : 'not found',
          )

          if (!courseMetadata) {
            console.error(
              '[Agent Route] Course metadata not found for:',
              courseName,
            )
            emit({
              type: 'error',
              message: 'Could not fetch course metadata',
              recoverable: false,
            })
            return
          }

          // Get or create conversation
          const conversation = await getOrCreateConversation(
            conversationId,
            model.id,
            courseName,
            userIdentifier,
            systemPrompt || courseMetadata.system_prompt || '',
            temperature ?? 0.7,
          )

          if (!conversation) {
            emit({
              type: 'error',
              message: 'Could not create or fetch conversation',
              recoverable: false,
            })
            return
          }

          // Ensure conversation has agent mode enabled
          conversation.agentModeEnabled = true

          // Create user message
          let messageContent: string | Content[]
          if (typeof userMessage.content === 'string') {
            messageContent = userMessage.content
          } else if (Array.isArray(userMessage.content)) {
            messageContent = userMessage.content.map(
              (c): Content => ({
                type: (c.type || 'text') as Content['type'],
                text: c.text,
                image_url: c.image_url,
              }),
            )
          } else {
            messageContent = String(userMessage.content)
          }

          const newUserMessage: Message = {
            id: userMessage.id,
            role: 'user',
            content: messageContent,
            imageUrls: userMessage.imageUrls,
            created_at: new Date().toISOString(),
            contexts: fileUploadContexts?.map((ctx, idx) => ({
              id: ctx.id ?? idx,
              text: ctx.text,
              readable_filename: ctx.readable_filename,
              course_name: courseName,
              'course_name ': courseName,
              s3_path: ctx.s3_path,
              pagenumber: '',
              url: ctx.url || '',
              base_url: '',
            })),
          }

          // Get OpenAI key
          const openaiKey = getOpenAIKey(llmProviders, courseMetadata)
          if (!openaiKey) {
            emit({
              type: 'error',
              message: 'No OpenAI API key configured for this project',
              recoverable: false,
            })
            return
          }

          await runAgentConversation({
            conversation,
            courseName,
            userMessage: newUserMessage,
            documentGroups: documentGroups || [],
            courseMetadata,
            llmProviders: llmProviders || ({} as AllLLMProviders),
            openaiKey,
            userIdentifier,
            emit,
          })
        } catch (error) {
          console.error('Error in agent conversation:', error)
          emit({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: false,
          })
        } finally {
          if (!controllerClosed) {
            controllerClosed = true
            controller.close()
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in agent route handler:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 },
    )
  }
}

export const POST = withCourseAccessFromRequest('any')(handler as any)
