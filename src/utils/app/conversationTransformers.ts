import { type Database } from 'database.types'

import {
  type Content,
  type ContextWithMetadata,
  type Conversation,
  type Message as ChatMessage,
  type Role,
  type UIUCTool,
} from '@/types/chat'

import { sanitizeText } from '@/utils/sanitization'

import {
  AllSupportedModels,
  type GenericSupportedModel,
} from '~/utils/modelProviders/LLMProvider'

import { v4 as uuidv4 } from 'uuid'

export type DBConversation =
  Database['public']['Tables']['conversations']['Row']
export type DBMessage = Database['public']['Tables']['messages']['Row']

export function convertChatToDBConversation(
  chatConversation: Conversation,
): DBConversation {
  return {
    id: chatConversation.id,
    name: chatConversation.name,
    model: chatConversation.model.id,
    prompt: chatConversation.prompt,
    temperature: chatConversation.temperature,
    user_email: chatConversation.userEmail || null,
    project_name: chatConversation.projectName || '',
    folder_id: chatConversation.folderId || null,
    created_at: chatConversation.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function convertDBToChatConversation(
  dbConversation: DBConversation,
  dbMessages: DBMessage[],
): Conversation {
  const sortedMessages = (dbMessages || []).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime()
    const bTime = new Date(b.created_at || 0).getTime()
    return aTime - bTime
  })

  return {
    id: dbConversation.id,
    name: dbConversation.name,
    model: Array.from(AllSupportedModels).find(
      (model) => model.id === dbConversation.model,
    ) as GenericSupportedModel,
    prompt: dbConversation.prompt,
    temperature: dbConversation.temperature,
    userEmail: dbConversation.user_email || undefined,
    projectName: dbConversation.project_name,
    folderId: dbConversation.folder_id,
    messages: sortedMessages.map((msg) => convertDBMessageToChatMessage(msg)),
    createdAt: dbConversation.created_at || undefined,
    updatedAt: dbConversation.updated_at || undefined,
  }
}

export function convertChatToDBMessage(
  chatMessage: ChatMessage,
  conversationId: string,
): DBMessage {
  let content_text = ''
  let content_image_urls: string[] = []
  let image_description = ''

  if (typeof chatMessage.content === 'string') {
    content_text = sanitizeText(chatMessage.content)
  } else if (Array.isArray(chatMessage.content)) {
    content_text = sanitizeText(
      chatMessage.content
        .filter((content) => content.type === 'text' && content.text)
        .map((content) => {
          if (
            (content.text as string).trim().startsWith('Image description:')
          ) {
            image_description = sanitizeText(
              content.text?.split(':').slice(1).join(':').trim() || '',
            )
            return ''
          }
          return content.text
        })
        .join(' '),
    )

    content_image_urls = chatMessage.content
      .filter((content) => content.type === 'image_url')
      .map((content) => content.image_url?.url || '')
  }

  const contextsArray = Array.isArray(chatMessage.contexts)
    ? chatMessage.contexts
    : chatMessage.contexts
      ? [chatMessage.contexts]
      : []

  return {
    id: chatMessage.id || uuidv4(),
    role: chatMessage.role,
    content_text: content_text,
    content_image_url: content_image_urls,
    image_description: image_description,
    contexts:
      contextsArray.map((context, index) => {
        const baseContext = {
          readable_filename: context.readable_filename,
          pagenumber: context.pagenumber,
          pagenumber_or_timestamp: context.pagenumber_or_timestamp,
          s3_path: context.s3_path,
          url: context.url,
          text: context.text
            ? sanitizeText(
                context.text.length > 100
                  ? context.text.slice(0, 100) + '...'
                  : context.text,
              )
            : '',
        }

        if (context.s3_path) {
          return {
            ...baseContext,
            chunk_index: context.s3_path + '_' + index,
          }
        } else if (context.url) {
          return {
            ...baseContext,
            url_chunk_index: context.url + '_' + index,
          }
        }

        return JSON.parse(JSON.stringify(context))
      }) || [],
    tools: chatMessage.tools
      ? JSON.parse(JSON.stringify(chatMessage.tools))
      : null,
    latest_system_message: chatMessage.latestSystemMessage
      ? sanitizeText(chatMessage.latestSystemMessage)
      : null,
    final_prompt_engineered_message: chatMessage.finalPromtEngineeredMessage
      ? sanitizeText(chatMessage.finalPromtEngineeredMessage)
      : null,
    response_time_sec: chatMessage.responseTimeSec || null,
    conversation_id: conversationId,
    created_at: chatMessage.created_at || new Date().toISOString(),
    updated_at: chatMessage.updated_at || new Date().toISOString(),
    feedback_is_positive: chatMessage.feedback?.isPositive ?? null,
    feedback_category: chatMessage.feedback?.category
      ? sanitizeText(chatMessage.feedback.category)
      : null,
    feedback_details: chatMessage.feedback?.details
      ? sanitizeText(chatMessage.feedback.details)
      : null,
    was_query_rewritten: chatMessage.wasQueryRewritten ?? null,
    query_rewrite_text: chatMessage.queryRewriteText
      ? sanitizeText(chatMessage.queryRewriteText)
      : null,
  }
}

export function convertDBMessageToChatMessage(msg: DBMessage) {
  const content: Content[] = []

  if (msg.content_text) {
    content.push({
      type: 'text',
      text: msg.content_text,
    })
  }

  if (msg.image_description) {
    content.push({
      type: 'text',
      text: `Image description: ${msg.image_description}`,
    })
  }

  if (msg.content_image_url && msg.content_image_url.length > 0) {
    for (const imageUrl of msg.content_image_url) {
      content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      })
    }
  }

  const feedbackObj =
    msg.feedback_is_positive !== undefined
      ? {
          isPositive: msg.feedback_is_positive,
          category: msg.feedback_category,
          details: msg.feedback_details,
        }
      : undefined

  const contexts = Array.isArray(msg.contexts)
    ? (msg.contexts as unknown as ContextWithMetadata[]).map((context) => ({
        ...context,
        pagenumber: context.pagenumber || '',
        pagenumber_or_timestamp: context.pagenumber_or_timestamp || undefined,
      }))
    : []

  return {
    id: msg.id,
    role: msg.role as Role,
    content: content,
    contexts: contexts,
    tools: (msg.tools as any as UIUCTool[]) || [],
    latestSystemMessage: msg.latest_system_message || undefined,
    finalPromtEngineeredMessage:
      msg.final_prompt_engineered_message || undefined,
    responseTimeSec: msg.response_time_sec || undefined,
    created_at: msg.created_at || undefined,
    updated_at: msg.updated_at || undefined,
    feedback: feedbackObj,
    wasQueryRewritten: msg.was_query_rewritten ?? undefined,
    queryRewriteText: msg.query_rewrite_text ?? undefined,
  }
}
