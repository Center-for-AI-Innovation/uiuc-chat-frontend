import { NextApiResponse } from 'next'
import {
  db,
  messages,
  conversations as conversationsTable,
} from '~/db/dbClient'
import { AuthenticatedRequest } from '~/utils/authMiddleware'
import { type Conversation as ChatConversation } from '@/types/chat'
import { Database } from 'database.types'
import { v4 as uuidv4 } from 'uuid'
import { inArray, eq, and, isNull, sql } from 'drizzle-orm'
import { NewConversations } from '~/db/schema'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import { getUserIdentifier } from '~/pages/api/_utils/userIdentifier'
import {
  convertChatToDBConversation,
  convertChatToDBMessage,
  convertDBToChatConversation,
  type DBConversation,
} from '@/utils/app/conversationTransformers'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req
  const user_identifier = getUserIdentifier(req)

  switch (method) {
    case 'POST':
      // Legacy support: still allow full save but redirect clients to PATCH/ messages API
      const { conversation }: { conversation: ChatConversation } = req.body
      try {
        // Validate user identifier is available
        if (!user_identifier) {
          return res.status(400).json({
            error: 'No valid user identifier provided',
            message: 'Cannot save conversation without a valid user identifier',
          })
        }

        // Convert conversation to DB type
        const dbConversation = convertChatToDBConversation(conversation)
        await upsertConversationRecord(dbConversation, user_identifier)
        // Save messages using messages API to maintain backward compatibility
        for (const message of conversation.messages) {
          const dbMessage = convertChatToDBMessage(message, conversation.id)
          await db
            .insert(messages)
            .values({
              ...dbMessage,
              created_at: dbMessage.created_at
                ? new Date(dbMessage.created_at)
                : new Date(),
              updated_at: dbMessage.updated_at
                ? new Date(dbMessage.updated_at)
                : new Date(),
            })
            .onConflictDoNothing()
        }

        res.status(200).json({ message: 'Conversation saved successfully' })
      } catch (error) {
        res
          .status(500)
          .json({ error: `Error saving conversation` + error?.toString() })
        console.error('Error saving conversation:', error)
      }
      break

    case 'PATCH':
      try {
        const {
          conversation: incomingConversation,
        }: { conversation: Partial<DBConversation> } = req.body

        if (!incomingConversation?.id) {
          return res.status(400).json({
            error: 'conversation.id is required',
          })
        }

        if (!user_identifier) {
          return res.status(400).json({
            error: 'No valid user identifier provided',
          })
        }

        const dbConversation: DBConversation = {
          id: incomingConversation.id,
          name: incomingConversation.name ?? '',
          model: incomingConversation.model ?? 'gpt-4o-mini',
          prompt: incomingConversation.prompt ?? '',
          temperature: incomingConversation.temperature ?? 0.7,
          user_email: incomingConversation.user_email ?? user_identifier,
          project_name: incomingConversation.project_name ?? '',
          folder_id: incomingConversation.folder_id ?? null,
          created_at:
            incomingConversation.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        await upsertConversationRecord(dbConversation, user_identifier)

        res.status(200).json({ success: true })
      } catch (error) {
        console.error('Error updating conversation metadata:', error)
        res.status(500).json({ error: 'Error updating conversation metadata' })
      }
      break

    case 'GET':
      const searchTerm = req.query.searchTerm as string
      const courseName = req.query.courseName as string
      const pageParam = parseInt(req.query.pageParam as string, 0)
      // Search term is optional
      if (!user_identifier || !courseName || isNaN(pageParam)) {
        console.error('Invalid query parameters:', req.query)
        res.status(400).json({
          error: 'Invalid query parameters',
          message: 'user_identifier, courseName, and pageParam are required',
        })
        return
      }

      try {
        const pageSize = 8
        const offset = pageParam * pageSize

        // Execute the SQL query directly using db.execute
        const result = await db.execute<{
          search_conversations_v3: { conversations: any[]; total_count: number }
        }>(sql`
          SELECT * FROM search_conversations_v3(
            ${user_identifier},
            ${courseName},
            ${searchTerm || null},
            ${pageSize},
            ${offset}
               );
        `)

        // Parse the result - handle potential different result structures
        const sqlResult = result[0]?.search_conversations_v3

        // Need to properly parse the result which might be a string
        let parsedData: { conversations: any[]; total_count: number }

        if (typeof sqlResult === 'string') {
          // If the result is a JSON string
          parsedData = JSON.parse(sqlResult)
        } else {
          // If the result is already an object
          parsedData = sqlResult as {
            conversations: any[]
            total_count: number
          }
        }

        const count = parsedData?.total_count || 0
        const conversations = parsedData?.conversations || []

        const fetchedConversations = conversations.map((conv: any) => {
          const convMessages = conv.messages || []
          return convertDBToChatConversation(conv, convMessages)
        })

        const nextCursor =
          count &&
          count > (pageParam + 1) * pageSize &&
          count > fetchedConversations.length
            ? pageParam + 1
            : null

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
        course_name,
      }: {
        id?: string
        course_name?: string
      } = req.body as {
        id?: string
        course_name?: string
      }

      try {
        if (id && user_identifier) {
          // Delete single conversation, but only if it belongs to the current user
          const deleted = await db
            .delete(conversationsTable)
            .where(
              and(
                eq(conversationsTable.id, id),
                eq(conversationsTable.user_email, user_identifier),
              ),
            )
            .returning({ id: conversationsTable.id })
          if (deleted.length === 0) {
            return res
              .status(403)
              .json({ error: 'Not allowed to delete this conversation' })
          }
        } else if (user_identifier && course_name) {
          // Delete all conversations for this user/course that are not in folders
          const deleted = await db
            .delete(conversationsTable)
            .where(
              and(
                eq(conversationsTable.user_email, user_identifier),
                eq(conversationsTable.project_name, course_name),
                isNull(conversationsTable.folder_id),
              ),
            )
            .returning({ id: conversationsTable.id })
          if (deleted.length === 0) {
            return res
              .status(403)
              .json({ error: 'Not allowed to delete all conversations' })
          }
        } else {
          res.status(400).json({
            error: 'Invalid user identifier or invalid request parameters',
          })
          return
        }
        res.status(200).json({ success: true })
      } catch (err) {
        console.error('Error deleting conversations:', err)
        res.status(500).json({ error: 'Internal server error' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default withCourseAccessFromRequest('any')(handler)

async function upsertConversationRecord(
  dbConversation: DBConversation,
  userIdentifier: string,
) {
  const conversationData: NewConversations = {
    id: dbConversation.id,
    name: dbConversation.name,
    model: dbConversation.model,
    prompt: dbConversation.prompt,
    temperature: dbConversation.temperature,
    user_email: userIdentifier || null,
    project_name: dbConversation.project_name,
    folder_id: dbConversation.folder_id || null,
    created_at: dbConversation.created_at
      ? new Date(dbConversation.created_at)
      : new Date(),
    updated_at: new Date(),
  }

  await db
    .insert(conversationsTable)
    .values(conversationData)
    .onConflictDoUpdate({
      target: conversationsTable.id,
      set: {
        name: conversationData.name,
        model: conversationData.model,
        prompt: conversationData.prompt,
        temperature: conversationData.temperature,
        user_email: conversationData.user_email,
        project_name: conversationData.project_name,
        folder_id: conversationData.folder_id,
        updated_at: new Date(),
      },
    })
}
