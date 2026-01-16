import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import fetchContextsFromBackend from '~/pages/util/fetchContexts'

export default withCourseAccessFromRequest('any')(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // TODO: Does this need to take req.user?.email into account to filter results?

  try {
    const {
      course_name,
      search_query,
      token_limit = 4000,
      doc_groups = [],
      conversation_id,
    } = req.body

    if (!course_name || !search_query) {
      return res.status(400).json({
        error: 'course_name and search_query are required',
      })
    }

    // Use the common function
    const data = await fetchContextsFromBackend(
      course_name,
      search_query,
      token_limit,
      doc_groups,
      conversation_id,
    )
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return res.status(500).json({
      error: 'Internal server error while fetching contexts',
      data: [],
    })
  }
}
