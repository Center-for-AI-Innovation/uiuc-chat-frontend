import { type NextApiResponse } from 'next'
import { AuthenticatedRequest } from '~/utils/authMiddleware'
import { db } from '~/db/dbClient'
import {
  type Content,
  type Conversation,
  type Message,
  type SaveConversationDelta,
  type ConversationMeta,
} from '~/types/chat'
import { RunTree } from 'langsmith'
import { sanitizeForLogging } from '@/utils/sanitization'
import { llmConvoMonitor } from '~/db/schema'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import { AllSupportedModels } from '~/utils/modelProviders/LLMProvider'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

type LogConversationBody =
  | {
      course_name: string
      conversation: Conversation
      delta?: SaveConversationDelta
      message?: Message
      metaOverride?: ConversationMeta
    }
  | {
      course_name: string
      delta: SaveConversationDelta
      message?: Message
      metaOverride?: ConversationMeta
    }

const logConversation = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
) => {
  const body = req.body as LogConversationBody
  const { course_name, delta, message, metaOverride } = body
  const conversation = 'conversation' in body ? body.conversation : undefined

  let sanitizedConversation: Conversation | null = null

  if (!course_name) {
    return res.status(400).json({ error: 'Missing course_name in request body' })
  }

  if (!conversation && !delta) {
    return res
      .status(400)
      .json({ error: 'Either conversation or delta must be provided' })
  }

  // Prefer delta payload if provided
  if (delta) {
    const { conversation: meta, messagesDelta } = delta

    const baseMeta = metaOverride ?? meta
    const availableModels = Array.from(AllSupportedModels)
    const resolvedModel =
      availableModels.find((model) => model.id === baseMeta.modelId) ||
      availableModels[0]

    if (!resolvedModel) {
      return res
        .status(400)
        .json({ error: 'No supported models available for logging' })
    }

    const minimalConversation: Conversation = {
      id: baseMeta.id,
      name: baseMeta.name,
      model: resolvedModel,
      prompt: baseMeta.prompt,
      temperature: baseMeta.temperature,
      userEmail: baseMeta.userEmail || undefined,
      projectName: baseMeta.projectName,
      folderId: baseMeta.folderId,
      messages:
        messagesDelta && messagesDelta.length > 0
          ? (messagesDelta as Message[])
          : message
            ? [message]
            : [],
    }

    sanitizedConversation = sanitizeForLogging(minimalConversation)
  } else if (conversation) {
    sanitizedConversation = sanitizeForLogging(conversation)
  }

  if (!sanitizedConversation) {
    return res.status(400).json({ error: 'Unable to construct conversation payload' })
  }

  const conversationId = sanitizedConversation.id?.toString?.() || null
  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation id is required' })
  }

  const messagesForLog = Array.isArray(sanitizedConversation.messages)
    ? (sanitizedConversation.messages as Message[])
    : []

  const latestAssistantMessage = messagesForLog[messagesForLog.length - 1]
  const previousUserMessage = messagesForLog[messagesForLog.length - 2]

  try {
    const result = await db
      .insert(llmConvoMonitor)
      .values({
        convo: sanitizedConversation,
        convo_id: conversationId,
        course_name: course_name,
        user_email: sanitizedConversation.userEmail,
      })
      .onConflictDoUpdate({
        target: [llmConvoMonitor.convo_id],
        set: {
          convo: sanitizedConversation,
          convo_id: conversationId,
          course_name: course_name,
          user_email: sanitizedConversation.userEmail,
        },
      })
  } catch (error: any) {
    console.log('new error from database in logConversation:', error)
  }

  // Send to our custom monitor
  try {
    const response = await fetch(getBackendUrl() + '/llm-monitor-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // messages: sanitizedConversation.messages, // we get these from database on the backend.
        course_name: course_name,
        conversation_id: conversationId,
        model_name: sanitizedConversation.model?.name,
        user_email: sanitizedConversation.userEmail,
      }),
    })

    if (!response.ok) {
      console.error('Error sending to AI TA backend:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending to AI TA backend:', error)
  }

  // console.log('👇👇👇👇👇👇👇👇👇👇👇👇👇')
  // console.log(
  //   '2nd Latest message object (user)',
  //   conversation.messages[conversation.messages.length - 2],
  // )
  // console.log(
  //   'Latest message object (assistant)',
  //   conversation.messages[conversation.messages.length - 1],
  // )
  // console.log('full convo id', conversation.id)
  // console.log(
  //   'User message',
  //   (
  //     conversation.messages[conversation.messages.length - 2]
  //       ?.content[0] as Content
  //   ).text,
  // )
  // console.log(
  //   'Assistant message',
  //   conversation.messages[conversation.messages.length - 2]?.content,
  // )
  // console.log(
  //   'Engineered prompt',
  //   conversation.messages[conversation.messages.length - 2]!
  //     .finalPromtEngineeredMessage,
  // )
  // console.log(
  //   'System message',
  //   conversation.messages[conversation.messages.length - 2]!
  //     .latestSystemMessage,
  // )
  // console.log('👆👆👆👆👆👆👆👆👆👆👆👆👆')

  // Log to Langsmith
  const rt = new RunTree({
    run_type: 'llm',
    name: 'Final Response Log',
    inputs: {
      'User input': sanitizeForLogging(
        (previousUserMessage?.content as Content[] | undefined)?.[0]?.text,
      ),
      'System message': sanitizeForLogging(
        previousUserMessage?.latestSystemMessage,
      ),
      'Engineered prompt': sanitizeForLogging(
        previousUserMessage?.finalPromtEngineeredMessage,
      ),
    },
    outputs: {
      Assistant: sanitizeForLogging(
        latestAssistantMessage?.content,
      ),
    },
    project_name: 'uiuc-chat-production',
    metadata: {
      projectName: course_name,
      conversation_id: conversationId,
      tools: sanitizeForLogging(
        previousUserMessage?.tools,
      ),
    }, // "conversation_id" is a SPECIAL KEYWORD. CANNOT BE ALTERED: https://docs.smith.langchain.com/old/monitoring/faq/threads
    // id: conversation.id, // DON'T USE - breaks the threading support
  })

  // End and submit the run
  if (latestAssistantMessage && previousUserMessage) {
    rt.end()
    await rt.postRun()
  }
  // console.log('✅✅✅✅✅✅✅✅ AFTER ALL LANGSMITH CALLS')

  return res.status(200).json({ success: true })
}

export default withCourseAccessFromRequest('any')(logConversation)
