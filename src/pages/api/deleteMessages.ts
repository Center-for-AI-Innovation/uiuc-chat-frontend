import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { conversations as conversationsTable, db, messages } from '~/db/dbClient'
import { and, inArray, sql } from 'drizzle-orm'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  console.log('In deleteMessages handler')
  const { method } = req
  if (method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${method} Not Allowed`)
    return
  }
  const {
    messageIds,
    course_name: courseName,
  } = req.body as {
    messageIds: string[]
    course_name: string
  }
  const userEmail = req.user?.email
  console.log('Deleting messages: ', messageIds)

  if (!messageIds || !Array.isArray(messageIds) || !messageIds.length) {
    res.status(400).json({ error: 'No valid message ids provided' })
    return
  }
  if (!userEmail) {
    res.status(400).json({ error: 'No valid user email provided' })
    return
  }
  if (!courseName) {
    res.status(400).json({ error: 'No valid course name provided' })
    return
  }

  try {
    // Keep IDs as strings since they are UUIDs
    const result = await db
      .delete(messages)
      .where(
        and(
          inArray(messages.id, messageIds),
          sql`exists (
            select 1
            from ${conversationsTable} c
            where c.id = ${messages.conversation_id}
              and c.user_email = ${userEmail}
          )`
        )
      )
      .returning({ id: messages.id });

    if (result.length === 0) {
      return res.status(403).json({ error: 'Not allowed to delete the message' });
    }

    return res.status(200).json({ message: 'Messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export default withCourseAccessFromRequest('any')(handler)
