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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
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
  // console.log('dbConversation: ', dbConversation)
  // console.log('dbMessages: ', dbMessages)
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
    messages: (dbMessages || []).map((msg: any) => {
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

      const feedbackObj = msg.feedback
        ? {
            isPositive: msg.feedback.feedback_is_positive,
            category: msg.feedback.feedback_category,
            details: msg.feedback.feedback_details,
          }
        : undefined

      const messageObj = {
        id: msg.id,
        role: msg.role as Role,
        content: content,
        contexts: (msg.contexts as any as ContextWithMetadata[]) || [],
        tools: (msg.tools as any as UIUCTool[]) || [],
        latestSystemMessage: msg.latest_system_message || undefined,
        finalPromtEngineeredMessage:
          msg.final_prompt_engineered_message || undefined,
        responseTimeSec: msg.response_time_sec || undefined,
        created_at: msg.created_at || undefined,
        updated_at: msg.updated_at || undefined,
        feedback: feedbackObj,
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
  console.log(
    'chatMessage',
    'for id: ',
    conversationId,
    'for message: ',
    // chatMessage,
  )
  // console.log('chatMessage.content type: ', typeof chatMessage.content)
  let content_text = ''
  let content_image_urls: string[] = []
  let image_description = ''
  if (typeof chatMessage.content == 'string') {
    content_text = chatMessage.content
  } else if (Array.isArray(chatMessage.content)) {
    content_text = chatMessage.content
      .filter((content) => content.type === 'text' && content.text)
      .map((content) => {
        if ((content.text as string).trim().startsWith('Image description:')) {
          image_description =
            content.text?.split(':').slice(1).join(':').trim() || ''
          return ''
        }
        return content.text
      })
      .join(' ')
    content_image_urls = chatMessage.content
      .filter((content) => content.type === 'image_url')
      .map((content) => content.image_url?.url || '')
  }

  return {
    id: chatMessage.id || uuidv4(),
    role: chatMessage.role,
    content_text: content_text,
    content_image_url: content_image_urls,
    image_description: image_description,
    contexts:
      chatMessage.contexts?.map((context, index) => {
        // TODO:
        // This is where we will put context_id in the future
        // console.log('context: ', context)
        if (context.s3_path) {
          return { chunk_index: context.s3_path + '_' + index }
        } else if (context.url) {
          return { url_chunk_index: context.url + '_' + index }
        } else return JSON.parse(JSON.stringify(context)) // Ensure context is JSON-compatible
      }) || [],
    tools: chatMessage.tools || (null as any),
    latest_system_message: chatMessage.latestSystemMessage || null,
    final_prompt_engineered_message:
      chatMessage.finalPromtEngineeredMessage || null,
    response_time_sec: chatMessage.responseTimeSec || null,
    conversation_id: conversationId,
    created_at: chatMessage.created_at || new Date().toISOString(),
    updated_at: chatMessage.updated_at || new Date().toISOString(),
    feedback_is_positive: chatMessage.feedback?.isPositive ?? null,
    feedback_category: chatMessage.feedback?.category ?? null,
    feedback_details: chatMessage.feedback?.details ?? null,
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
        console.log(
          'Saving conversation to server with db object:',
          dbConversation,
        )

        if (conversation.messages.length === 0) {
          throw new Error('No messages in conversation, not saving!')
        }
        // Save conversation to Supabase
        const { data, error } = await supabase
          .from('conversations')
          .upsert([dbConversation], { onConflict: 'id' })

        if (error) throw error

        // Convert and save messages
        for (const message of conversation.messages) {
          const dbMessage = convertChatToDBMessage(message, conversation.id)
          await supabase.from('messages').upsert(dbMessage)
        }

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

        const { data, error } = await supabase.rpc('search_conversations_v2', {
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
        console.error('Error fetching conversation history:', error)
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
      console.log(
        'id: ',
        id,
        'userEmail: ',
        userEmail,
        'course_name: ',
        course_name,
      )
      try {
        if (id) {
          // Delete conversation
          const { data, error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id)
          if (error) throw error
        } else if (userEmail && course_name) {
          // Delete all conversations
          console.log('deleting all conversations')
          const { data, error } = await supabase
            .from('conversations')
            .delete()
            .eq('user_email', userEmail)
            .eq('project_name', course_name)
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
