import { withAuth } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name } = req.query

  if (!course_name || typeof course_name !== 'string') {
    return res.status(400).json({ error: 'course_name parameter is required' })
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/getAll?course_name=${course_name}`,
    )

    if (!response.ok) {
      console.error('Failed to fetch course data. Err status:', response.status)
      return res.status(response.status).json({
        error: `Failed to fetch course data. Status: ${response.status}`,
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching course data:', error)
    return res.status(500).json({
      error: 'Internal server error while fetching course data',
    })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
