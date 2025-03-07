import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import {
  Conversation as ChatConversation,
  Message as ChatMessage,
  Content,
  ContextWithMetadata,
  Role,
  UIUCTool,
} from '@/types/chat'
import { Database } from 'database.types'
import { v4 as uuidv4 } from 'uuid'
import {
  AllSupportedModels,
  GenericSupportedModel,
} from '~/utils/modelProviders/LLMProvider'
import { sanitizeText } from '@/utils/sanitization'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
export type DBConversation =
  Database['public']['Tables']['conversations']['Row']
export type DBMessage = Database['public']['Tables']['messages']['Row']

export function convertChatToDBConversation(
  chatConversation: ChatConversation,
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
): ChatConversation {
  // First sort the messages by creation time
  const sortedMessages = (dbMessages || []).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime()
    const bTime = new Date(b.created_at || 0).getTime()
    return aTime - bTime
  })

  // Validate that we have the first message (usually system or user)
  if (sortedMessages.length > 0) {
    const firstMessage: DBMessage | undefined = sortedMessages[0]
    if (firstMessage?.role && firstMessage?.created_at) {
      // console.debug('First message in conversation:', {
      //   id: firstMessage?.id,
      //   role: firstMessage?.role,
      //   created_at: firstMessage?.created_at,
      //   isSystem: firstMessage?.role === 'system',
      //   isUser: firstMessage?.role === 'user'
      // });
    } else {
      console.warn(
        'No valid first message found in conversation:',
        dbConversation.id,
      )
    }
  }

  // Now convert the sorted messages
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
    messages: sortedMessages.map((msg: any) => {
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
      // add summary message
      if (msg.summary) {
        content.push({
          type: 'summary',
          text: msg.summary,
        })
      }

      const feedbackObj = msg.feedback
        ? {
            isPositive: msg.feedback.feedback_is_positive,
            category: msg.feedback.feedback_category,
            details: msg.feedback.feedback_details,
          }
        : undefined

      // Process contexts to ensure both page number fields are preserved
      const processedContexts =
        (msg.contexts as any as ContextWithMetadata[])?.map((context) => {
          return {
            ...context,
            pagenumber: context.pagenumber || '',
            pagenumber_or_timestamp:
              context.pagenumber_or_timestamp || undefined,
          }
        }) || []

      const messageObj = {
        id: msg.id,
        role: msg.role as Role,
        content: content,
        contexts: processedContexts,
        tools: (msg.tools as any as UIUCTool[]) || [],
        latestSystemMessage: msg.latest_system_message || undefined,
        finalPromtEngineeredMessage:
          msg.final_prompt_engineered_message || undefined,
        responseTimeSec: msg.response_time_sec || undefined,
        created_at: msg.created_at || undefined,
        updated_at: msg.updated_at || undefined,
        feedback: feedbackObj,
        wasQueryRewritten: msg.was_query_rewritten ?? null,
        queryRewriteText: msg.query_rewrite_text ?? null,
      }

      return messageObj
    }),
    createdAt: dbConversation.created_at || undefined,
    updatedAt: dbConversation.updated_at || undefined,
  }
}

export function convertChatToDBMessage(
  chatMessage: ChatMessage,
  conversationId: string,
): DBMessage {
  const content_type = ''
  let content_text = ''
  let content_image_urls: string[] = []
  let image_description = ''
  if (typeof chatMessage.content == 'string') {
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

  // Ensure contexts is an array before calling map
  const contextsArray = Array.isArray(chatMessage.contexts)
    ? chatMessage.contexts
    : chatMessage.contexts
      ? [chatMessage.contexts]
      : []

  return {
    id: chatMessage.id || uuidv4(),
    role: chatMessage.role,
    // content_type: content_type,
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
          // Sanitize and truncate text to 100 characters and add ellipsis if needed
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
        return JSON.parse(JSON.stringify(context)) // Ensure context is JSON-compatible
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // console.log(
  //   'Received request for conversation API:',
  //   req.method,
  //   req.body,
  //   req.query,
  // )
  const { method } = req

  switch (method) {
    case 'POST':
      const {
        emailAddress,
        conversation,
      }: { emailAddress: string; conversation: ChatConversation } = req.body
      try {
        // Convert conversation to DB type
        const dbConversation = convertChatToDBConversation(conversation)

        if (conversation.messages.length === 0) {
          // Return success without saving - no need to throw an error
          return res.status(200).json({ message: 'No messages to save' })
        }
        // Save conversation to Supabase
        const { data, error } = await supabase
          .from('conversations')
          .upsert([dbConversation], { onConflict: 'id' })

        if (error) throw error

        // Check for edited messages and get their existing versions
        const messageIds = conversation.messages.map((m) => m.id)
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .in('id', messageIds)

        // Find any messages that were edited by comparing content
        const editedMessages = existingMessages?.filter((existingMsg) => {
          const newMsg = conversation.messages.find(
            (m) => m.id === existingMsg.id,
          )
          return (
            newMsg &&
            (existingMsg.content_text !==
              convertChatToDBMessage(newMsg, conversation.id).content_text ||
              JSON.stringify(existingMsg.contexts) !==
                JSON.stringify(
                  convertChatToDBMessage(newMsg, conversation.id).contexts,
                ))
          )
        })

        // If we found edited messages, delete all messages that came after the earliest edited message
        if (editedMessages && editedMessages.length > 0) {
          // Find the earliest edited message timestamp
          const earliestEditTime = Math.min(
            ...editedMessages.map((m) => new Date(m.created_at).getTime()),
          )

          // Delete all messages after this timestamp
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversation.id)
            .gt('created_at', new Date(earliestEditTime).toISOString())

          if (deleteError) {
            console.error('Error deleting subsequent messages:', deleteError)
            throw deleteError
          }
        }

        // Ensure messages have sequential timestamps based on their order
        const baseTime = new Date().getTime()
        const dbMessages = conversation.messages.map((message, index) => {
          // If the message wasn't edited, preserve its original timestamp
          const existingMessage = existingMessages?.find(
            (m) => m.id === message.id,
          )
          const wasEdited = editedMessages?.some((m) => m.id === message.id)

          let created_at
          if (existingMessage && !wasEdited) {
            created_at = existingMessage.created_at
          } else {
            created_at = new Date(baseTime + index * 1000).toISOString()
          }

          return {
            ...convertChatToDBMessage(message, conversation.id),
            created_at,
            updated_at: new Date().toISOString(),
          }
        })

        // Sort messages by created_at before upserting to ensure consistent order
        dbMessages.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )

        const { error: messagesError } = await supabase
          .from('messages')
          .upsert(dbMessages, {
            onConflict: 'id',
            ignoreDuplicates: false,
          })

        if (messagesError) throw messagesError

        res.status(200).json({ message: 'Conversation saved successfully' })
      } catch (error) {
        res
          .status(500)
          .json({ error: `Error saving conversation` + error?.toString() })
        console.error('Error saving conversation:', error)
      }
      break

    case 'GET':
      const user_email = req.query.user_email as string
      const searchTerm = req.query.searchTerm as string
      const courseName = req.query.courseName as string
      const pageParam = parseInt(req.query.pageParam as string, 0)
      // Search term is optional
      if (!user_email || !courseName || isNaN(pageParam)) {
        console.log('first boolean:', !user_email)
        console.log('second boolean:', !searchTerm)
        console.log('third boolean:', !courseName)
        console.log('fourth boolean:', isNaN(pageParam))
        console.log('Invalid query parameters:', req.query)
        res.status(400).json({ error: 'Invalid query parameters' })
        return
      }

      try {
        const pageSize = 8

        const { data, error } = await supabase.rpc('search_conversations_v3', {
          p_user_email: user_email,
          p_project_name: courseName,
          p_search_term: searchTerm || null,
          p_limit: pageSize,
          p_offset: pageParam * pageSize,
        })

        // console.log('data:', data)

        const count = data?.total_count || 0

        if (error) {
          console.error(
            'Error fetching conversation history in sql query:',
            error,
          )
          throw error
        }
        // console.log(
        //   'Fetched conversations before conversion in /conversation:',
        //   data,
        // )

        const fetchedConversations = (data.conversations || []).map(
          (conv: any) => {
            // console.log('Fetched conversation:', conv)
            const convMessages = conv.messages || []
            return convertDBToChatConversation(conv, convMessages)
          },
        )

        const nextCursor =
          count &&
          count > (pageParam + 1) * pageSize &&
          count > fetchedConversations.length
            ? pageParam + 1
            : null

        // console.log(
        //   'Fetched conversations:',
        //   fetchedConversations.length,
        //   'for user_email:',
        //   user_email,
        // )
        res.status(200).json({
          conversations: fetchedConversations,
          nextCursor: nextCursor,
        })
      } catch (error) {
        res.status(500).json({ error: 'Error fetching conversation history' })
        console.error(
          'pages/api/conversation.ts - Error fetching conversation history:',
          error,
        )
      }
      break

    case 'DELETE':
      const {
        id,
        user_email: userEmail,
        course_name,
      }: {
        id?: string
        user_email?: string
        course_name?: string
      } = req.body as {
        id?: string
        user_email?: string
        course_name?: string
      }

      try {
        if (id) {
          // Delete single conversation
          const { data, error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id)
          if (error) throw error
        } else if (userEmail && course_name) {
          // Delete all conversations that are not in folders
          const { data, error } = await supabase
            .from('conversations')
            .delete()
            .eq('user_email', userEmail)
            .eq('project_name', course_name)
            .is('folder_id', null) // Only delete conversations that are not in folders
          if (error) throw error
        } else {
          res.status(400).json({ error: 'Invalid request parameters' })
          return
        }

        res.status(200).json({ message: 'Conversation deleted successfully' })
      } catch (error) {
        res.status(500).json({ error: 'Error deleting conversation' })
        console.error('Error deleting conversation:', error)
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
