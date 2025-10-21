import { type NextApiResponse } from 'next'

import { getConversationWithMessages } from '~/db/dbHelpers'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import { getUserIdentifier } from '~/pages/api/_utils/userIdentifier'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const {
    query: { id, courseName },
    method,
  } = req

  if (method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Conversation id is required' })
  }

  if (!courseName || typeof courseName !== 'string') {
    return res.status(400).json({ error: 'courseName query param is required' })
  }

  const userIdentifier = getUserIdentifier(req)

  try {
    const conversation = await getConversationWithMessages(
      id,
      userIdentifier || undefined,
    )

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    return res.status(200).json({ conversation })
  } catch (error) {
    console.error('Error fetching conversation by id:', error)
    return res.status(500).json({ error: 'Error fetching conversation' })
  }
}

export default withCourseAccessFromRequest('any')(handler)
