import { NextApiRequest, NextApiResponse } from 'next'
import { db, folders } from '~/db/dbClient'
import { FolderInterface, FolderWithConversation } from '@/types/folder'
import { Database } from 'database.types'
import { convertDBToChatConversation, DBConversation } from './conversation'
import { NewFolders, Folders } from '~/db/schema'
import { eq, desc } from 'drizzle-orm'

type Folder = Database['public']['Tables']['folders']['Row']

export function convertDBFolderToChatFolder(
  dbFolder: Folder,
  dbConversations: any[],
): FolderWithConversation {
  return {
    id: dbFolder.id,
    name: dbFolder.name,
    type: dbFolder.type as 'chat' | 'prompt',
    conversations: (dbConversations || []).map((conv) => {
      const convMessages = conv.messages
      return convertDBToChatConversation(conv, convMessages)
    }),
    createdAt: dbFolder.created_at || new Date().toISOString(),
    updatedAt: dbFolder.updated_at || new Date().toISOString(),
  }
}

export function convertChatFolderToDBFolder(
  folder: FolderWithConversation,
  email: string,
): NewFolders {
  return {
    id: folder.id,
    name: folder.name,
    type: folder.type.toString(),
    user_email: email,
    created_at: new Date(folder.createdAt || new Date()),
    updated_at: new Date(),
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  const { method } = req

  switch (method) {
    case 'POST':
      const {
        folder,
        email,
      }: { folder: FolderWithConversation; email: string } = req.body
      //   Convert folder to DB type
      const dbFolder = convertChatFolderToDBFolder(folder, email)

      try {
        // Insert or update folder using DrizzleORM
        await db
          .insert(folders)
          .values(dbFolder)
          .onConflictDoUpdate({
            target: folders.id,
            set: {
              name: dbFolder.name,
              type: dbFolder.type,
              user_email: dbFolder.user_email,
              updated_at: new Date()
            }
          });

        res.status(200).json({ message: 'Folder saved successfully' })
      } catch (error) {
        console.error('Error saving folder:', error)
        res.status(500).json({ error: `Failed to save folder: ${error instanceof Error ? error.message : String(error)}` })
      }
      break

    case 'GET':
      const { user_email } = req.query
      try {
        if (!user_email || typeof user_email !== 'string') {
          res.status(400).json({ error: 'No valid email address provided' })
          return
        }

        // Query folders and their related conversations and messages using DrizzleORM
        const fetchedFolders = await db.query.folders.findMany({
          where: eq(folders.user_email, user_email),
          orderBy: desc(folders.created_at),
          with: {
            conversations: {
              with: {
                messages: {
                  columns: {
                    id: true,
                    role: true,
                    content_text: true,
                    content_image_url: true,
                    contexts: true,
                    tools: true,
                    latest_system_message: true,
                    final_prompt_engineered_message: true,
                    response_time_sec: true,
                    conversation_id: true,
                    created_at: true
                  }
                }
              },
              columns: {
                id: true,
                name: true,
                model: true,
                prompt: true,
                temperature: true,
                folder_id: true,
                user_email: true,
                project_name: true
              }
            }
          }
        });

        // Convert the fetched data to match the expected format
        const formattedFolders = fetchedFolders.map(folder => {
          const conversations = folder.conversations || [];
          // Convert Date objects to ISO strings before passing to convertDBFolderToChatFolder
          const folderWithStringDates = {
            ...folder,
            created_at: folder.created_at.toISOString(),
            updated_at: folder.updated_at?.toISOString() || null
          };
          return convertDBFolderToChatFolder(folderWithStringDates, conversations);
        });

        res.status(200).json(formattedFolders);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching folders' })
        console.error('Error fetching folders:', error)
      }
      break
    case 'DELETE':
      const { deletedFolderId } = req.body as {
        deletedFolderId: string
      }
      try {
        // Delete folder
        await db
          .delete(folders)
          .where(eq(folders.id, deletedFolderId))
        
        res.status(200).json({ message: 'Folder deleted successfully' })
      } catch (error) {
        res.status(500).json({ error: 'Error deleting folder' })
        console.error('Error deleting folder:', error)
      }

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
