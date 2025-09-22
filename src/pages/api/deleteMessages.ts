import { type NextApiResponse } from 'next'
import { AuthenticatedRequest } from '~/utils/authMiddleware'
import { db, messages } from '~/db/dbClient'
import { inArray } from 'drizzle-orm'
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
      .where(inArray(messages.id, messageIds))

    // DrizzleORM doesn't return data/error objects like Supabase
    // Instead it returns the number of affected rows
    if (!result) {
      throw new Error('Failed to delete messages')
    }

    res.status(200).json({ message: 'Messages deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export default withCourseAccessFromRequest('any')(handler)
