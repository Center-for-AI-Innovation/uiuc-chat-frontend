import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { api_key, limit, pagination } = req.query

  if (!api_key) {
    return res.status(400).json({ error: 'api_key is required' })
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/getworkflows?api_key=${api_key}&limit=${limit || 10}&pagination=${pagination || 'true'}`,
    )

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Unable to fetch n8n tools: ${response.statusText}`,
      })
    }

    const workflows = await response.json()
    return res.status(200).json(workflows)
  } catch (error) {
    console.error('Error fetching N8N workflows:', error)
    return res.status(500).json({
      error: 'Internal server error while fetching N8N workflows',
    })
  }
}

export default withCourseAccessFromRequest('any')(handler)
