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
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return aTime - bTime;
  });

  // Validate that we have the first message (usually system or user)
  if (sortedMessages.length > 0) {
    const firstMessage: DBMessage | undefined = sortedMessages[0];
    if (firstMessage?.role && firstMessage?.created_at) {
      console.debug('First message in conversation:', {
        id: firstMessage?.id,
        role: firstMessage?.role,
        created_at: firstMessage?.created_at,
        isSystem: firstMessage?.role === 'system',
        isUser: firstMessage?.role === 'user'
      });
    } else {
      console.warn('No valid first message found in conversation:', dbConversation.id);
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

      const feedbackObj = msg.feedback
        ? {
          isPositive: msg.feedback.feedback_is_positive,
          category: msg.feedback.feedback_category,
          details: msg.feedback.feedback_details,
        }
        : undefined

      // Process contexts to ensure both page number fields are preserved
      const processedContexts = (msg.contexts as any as ContextWithMetadata[])?.map(context => {
        return {
          ...context,
          pagenumber: context.pagenumber || '',
          pagenumber_or_timestamp: context.pagenumber_or_timestamp || undefined
        };
      }) || [];

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

      // Add debug logging for message ordering
      console.debug('Processing message in convertDBToChatConversation:', {
        messageId: msg.id,
        role: msg.role,
        created_at: msg.created_at,
        content_length: content.length
      });

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
        const baseContext = {
          readable_filename: context.readable_filename,
          pagenumber: context.pagenumber,
          pagenumber_or_timestamp: context.pagenumber_or_timestamp,
          s3_path: context.s3_path,
          url: context.url,
          // Truncate text to 100 characters and add ellipsis if needed
          text: context.text ? (context.text.length > 100 ? context.text.slice(0, 100) + '...' : context.text) : ''
        }
        
        if (context.s3_path) {
          return { 
            ...baseContext,
            chunk_index: context.s3_path + '_' + index 
          }
        } else if (context.url) {
          return { 
            ...baseContext,
            url_chunk_index: context.url + '_' + index 
          }
        } 
        return JSON.parse(JSON.stringify(context)) // Ensure context is JSON-compatible
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
    was_query_rewritten: chatMessage.wasQueryRewritten ?? null,
    query_rewrite_text: chatMessage.queryRewriteText ?? null,
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
        // Validate conversation object
        if (!conversation || typeof conversation !== 'object') {
          console.error('Invalid conversation object received:', conversation);
          throw new Error('Invalid conversation object');
        }

        // Log the size of the request and conversation details
        const requestSize = new TextEncoder().encode(JSON.stringify(req.body)).length;
        const conversationSize = new TextEncoder().encode(JSON.stringify(conversation)).length;
        console.debug('Request and conversation sizes:', {
          totalRequestSize: `${Math.round(requestSize / 1024 / 1024 * 100) / 100}MB`,
          conversationSize: `${Math.round(conversationSize / 1024 / 1024 * 100) / 100}MB`,
          messageCount: conversation?.messages?.length,
          totalContextCount: conversation?.messages?.reduce((sum, msg) => sum + (msg.contexts?.length || 0), 0)
        });

        // Convert conversation to DB type
        let dbConversation;
        try {
          dbConversation = convertChatToDBConversation(conversation);
          console.debug('Successfully converted to DB conversation');
        } catch (convError: any) {
          console.error('Error converting conversation to DB format:', convError);
          throw new Error(`Conversion error: ${convError.message}`);
        }

        if (!conversation.messages?.length) {
          console.error('No messages found in conversation:', conversation.id);
          throw new Error('No messages in conversation');
        }

        // Save conversation to Supabase with detailed error logging
        console.debug('Attempting to save conversation to Supabase...');
        const { data, error } = await supabase
          .from('conversations')
          .upsert([dbConversation], { onConflict: 'id' });

        if (error) {
          console.error('Error saving conversation to Supabase:', {
            error,
            errorMessage: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            conversationId: conversation.id,
            messageCount: conversation.messages.length
          });
          throw new Error(`Supabase error: ${error.message}`);
        }

        console.debug('Successfully saved conversation, proceeding to save messages...');

        // Convert and save all messages in batches
        const BATCH_SIZE = 3;
        for (let i = 0; i < conversation.messages.length; i += BATCH_SIZE) {
          const messageBatch = conversation.messages.slice(i, i + BATCH_SIZE);
          console.debug(`Processing message batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(conversation.messages.length/BATCH_SIZE)}`);
          
          let dbMessageBatch;
          try {
            dbMessageBatch = messageBatch.map(message => {
              const dbMessage = convertChatToDBMessage(message, conversation.id);
              const contexts = dbMessage.contexts;
              const contextCount = contexts && Array.isArray(contexts) ? contexts.length : 0;
              const messageSize = new TextEncoder().encode(JSON.stringify(dbMessage)).length;
              
              console.debug('Message %s details:', message.id, {
                contextCount,
                sizeKB: Math.round(messageSize / 1024 * 100) / 100,
                role: message.role,
                contentLength: JSON.stringify(message.content).length
              });
              
              return dbMessage;
            });
          } catch (convError: any) {
            console.error('Error converting message batch to DB format:', {
              error: convError,
              batchIndex: Math.floor(i/BATCH_SIZE) + 1,
              messageIds: messageBatch.map(m => m.id)
            });
            throw new Error(`Message conversion error: ${convError.message}`);
          }
          
          const batchSize = new TextEncoder().encode(JSON.stringify(dbMessageBatch)).length;
          console.debug(`Batch ${Math.floor(i/BATCH_SIZE) + 1} size: ${Math.round(batchSize / 1024 * 100) / 100}KB`);
          
          // Upsert messages with conflict resolution on id
          const { error: messageError } = await supabase
            .from('messages')
            .upsert(dbMessageBatch, {
              onConflict: 'id',
              ignoreDuplicates: false // Update existing messages if they exist
            });
          
          if (messageError) {
            console.error('Error saving message batch:', {
              error: messageError,
              errorMessage: messageError.message,
              details: messageError.details,
              hint: messageError.hint,
              code: messageError.code,
              batchIndex: Math.floor(i/BATCH_SIZE) + 1,
              batchSize: dbMessageBatch.length,
              messageIds: dbMessageBatch.map(m => m.id),
              batchSizeKB: Math.round(batchSize / 1024 * 100) / 100
            });
            
            if (messageError.message?.includes('too large') || messageError.message?.includes('413')) {
              throw new Error(`Message batch too large (${Math.round(batchSize / 1024 * 100) / 100}KB). Try reducing context size.`);
            }
            throw new Error(`Message save error: ${messageError.message}`);
          }
        }

        // Clean up any orphaned messages that are no longer part of the conversation
        const currentMessageIds = conversation.messages.map(m => m.id);
        const { error: cleanupError } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', conversation.id)
          .not('id', 'in', `(${currentMessageIds.map(id => `'${id}'`).join(',')})`);

        if (cleanupError) {
          console.warn('Non-critical error cleaning up orphaned messages:', {
            error: cleanupError,
            errorMessage: cleanupError.message,
            conversationId: conversation.id
          });
          // Don't throw error for cleanup failures as it's not critical
        }

        console.debug('Successfully saved all message batches');
        res.status(200).json({ message: 'Conversation saved successfully' });
      } catch (error) {
        console.error('Error in conversation save process:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
          conversationId: conversation?.id,
          messageCount: conversation?.messages?.length
        });
        
        // Check if it's a payload size error
        if (error instanceof Error && 
            (error.message?.includes('too large') || 
             error.message?.includes('413') || 
             error.message?.includes('Message batch too large'))) {
          res.status(413).json({ 
            error: 'Conversation data is too large. Try reducing the number of contexts per message or starting a new conversation.',
            details: error.message,
            code: (error as any)?.code
          });
        } else {
          res.status(500).json({ 
            error: `Error saving conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error instanceof Error ? error.stack : undefined,
            code: (error as any)?.code
          });
        }
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
        console.error('pages/api/conversation.ts - Error fetching conversation history:', error)
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
            .is('folder_id', null)  // Only delete conversations that are not in folders
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
