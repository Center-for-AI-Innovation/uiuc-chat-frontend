import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import axios, { type AxiosResponse } from 'axios'
import { type ContextWithMetadata } from '~/types/chat'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    course_name,
    search_query,
    token_limit = 6000,
    doc_groups = [],
    conversation_id,
  } = req.query

  if (!course_name || !search_query || !conversation_id) {
    return res.status(400).json({
      error: 'course_name, search_query, and conversation_id are required',
    })
  }

  try {
    // Note: This uses a different Railway service endpoint than the main RAILWAY_URL
    const mqrUrl = process.env.RAILWAY_MQR_URL
    if (!mqrUrl) {
      throw new Error(
        'No MQR backend URL configured. Please set RAILWAY_MQR_URL environment variable.',
      )
    }
    const response: AxiosResponse<ContextWithMetadata[]> = await axios.get(
      `${mqrUrl}/getTopContextsWithMQR`,
      {
        params: {
          course_name: course_name,
          search_query: search_query,
          token_limit: token_limit,
          doc_groups: Array.isArray(doc_groups)
            ? doc_groups
            : [doc_groups].filter(Boolean),
          conversation_id: conversation_id,
        },
      },
    )
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Error fetching MQR contexts:', error)
    return res.status(500).json({
      error: 'Internal server error while fetching MQR contexts',
      data: [],
    })
  }
}

export default withCourseAccessFromRequest('any')(handler)
