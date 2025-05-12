import { NextApiRequest, NextApiResponse } from 'next'
import { db, messages } from '~/db/dbClient'
import { NewMessages } from '~/db/schema'
import { convertChatToDBMessage } from '@/pages/api/conversation'
import { eq, desc, gt, asc, and, inArray } from 'drizzle-orm'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, conversationId, user_email, course_name } = req.body
    
    // First check if the message exists
    const existingMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.id, message.id))
      .limit(1);

    // Get the latest message's timestamp for this conversation
    const latestMessage = await db
      .select({ created_at: messages.created_at })
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(desc(messages.created_at))
      .limit(1);

    const dbMessage = convertChatToDBMessage(message, conversationId);

    // If this is a new message, ensure its timestamp is after the latest message
    if (!existingMessage && latestMessage?.[0]?.created_at) {
      const latestTime = new Date(latestMessage[0].created_at).getTime();
      dbMessage.created_at = new Date(latestTime + 1000).toISOString();
      dbMessage.updated_at = dbMessage.created_at;
    }

    const dbNewMessage: NewMessages = {
      ...dbMessage,
      created_at: new Date(dbMessage.created_at),
      updated_at: dbMessage.updated_at ? new Date(dbMessage.updated_at) : null
    };

    // If message exists, update it. If not, insert it.
    try{
      const result = await db
      .insert(messages)
      .values([dbNewMessage])
      .onConflictDoUpdate({
        target: [messages.id],
        set: {
          content_text: dbMessage.content_text,
          role: dbMessage.role,
          created_at: new Date(dbMessage.created_at),
          updated_at: dbMessage.updated_at ? new Date(dbMessage.updated_at) : null
        }
      });
    } catch (error: any) {
      console.error('Error in message upsert:', error);
      return res.status(500).json({ error: error.message });
    }
    

    // If this was an edit of an existing message, we need to handle following messages
    if (existingMessage) {
      const followingMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(
          eq(messages.conversation_id, conversationId),
          gt(messages.created_at, existingMessage[0]?.created_at ?? new Date(0))
        ))
        .orderBy(asc(messages.created_at));

      if (followingMessages?.length > 0) {
        // Delete the following messages since we can't mark them as superseded
        try{
          await db
            .delete(messages)
            .where(inArray(messages.id, followingMessages.map(m => m.id)));
        } catch (error: any) {
          console.error('Error in deleting the following superseded messages:', error);
          return res.status(500).json({ error: error.message });
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in upsert handler:', error);
    return res.status(500).json({ error: error.message });
  }
} 