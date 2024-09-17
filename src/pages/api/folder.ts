import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { FolderInterface, FolderWithConversation } from '@/types/folder'
import { Database } from 'database.types'
import { convertDBToChatConversation, DBConversation } from './conversation'

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
): Folder {
  return {
    id: folder.id,
    name: folder.name,
    type: folder.type.toString(),
    user_email: email,
    created_at: folder.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // console.log(
  //   'Received request for folders API:',
  //   req.method,
  //   req.body,
  //   req.query,
  // )
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
        const { data, error } = await supabase
          .from('folders')
          .upsert([dbFolder], { onConflict: 'id' })

        if (error) throw error

        res.status(200).json({ message: 'Folder saved successfully' })
      } catch (error) {
        res.status(500).json({ error: `Error saving folder: ` + error })
        console.error('Error saving folder:', error)
      }
      break

    case 'GET':
      const { user_email } = req.query
      try {
        if (!user_email || typeof user_email !== 'string') {
          res.status(400).json({ error: 'No valid email address provided' })
          return
        }

        const { data, error } = await supabase
          .from('folders')
          .select(
            `
            *,
            conversations (
              id,
              name,
              model,
              prompt,
              temperature,
              folder_id,
              user_email,
              project_name,
              messages (
                id,
                role,
                content_text,
                content_image_url,
                contexts,
                tools,
                latest_system_message,
                final_prompt_engineered_message,
                response_time_sec,
                conversation_id,
                created_at
              )
            )
          `,
          )
          .eq('user_email', user_email)
          .order('created_at', { ascending: false })

        if (error) throw error
        // console.log('Fetched conversations before conversion in /folder:', data)

        const fetchedFolders = (data || []).map((folder) => {
          const conversations = folder.conversations || []
          return convertDBFolderToChatFolder(folder, conversations)
        })

        // const { data, error } = await supabase
        //   .from('folders')
        //   .select('*, conversations(*, messages(*))')
        //   .eq('user_email', user_email)

        if (error) throw error

        // const folderResponse: FolderInterface[] = data.map(
        //   (folder: Folder) => ({
        //     id: folder.id,
        //     name: folder.name,
        //     type: folder.type as 'chat' | 'prompt',
        //   }),
        // )
        res.status(200).json(fetchedFolders)
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
        const { data, error } = await supabase
          .from('folders')
          .delete()
          .eq('id', deletedFolderId)
        if (error) throw error

        // if (type === 'chat') {
        //   console.log('type is chat, removing folder_id from conversations')
        //   // Remove folder_id from conversations
        //   const { data: convData, error: convError } = await supabase
        //     .from('conversations')
        //     .update({ folder_id: null })
        //     .eq('folder_id', deletedFolderId)

        //   if (convError) throw convError
        // } else if (type === 'prompt') {
        //   // Remove folder_id from prompts
        //   const { data: promptData, error: promptError } = await supabase
        //     .from('prompts')
        //     .update({ folder_id: null })
        //     .eq('folder_id', deletedFolderId)

        //   if (promptError) throw promptError
        // }

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
