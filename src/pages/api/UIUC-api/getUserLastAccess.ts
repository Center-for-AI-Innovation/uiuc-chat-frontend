import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getUserLastAccessForCourse } from '~/pages/api/UIUC-api/getCourseMetadata'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const courseName = req.query.course_name as string | undefined

  if (!courseName) {
    return res
      .status(400)
      .json({ error: 'Missing required course_name parameter' })
  }

  const userEmail = req.user?.email
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in token' })
  }

  try {
    const lastAccessedAt = await getUserLastAccessForCourse(
      userEmail,
      courseName,
    )

    return res.status(200).json({
      last_accessed_at: lastAccessedAt,
    })
  } catch (error) {
    console.error('Error fetching user last access:', error)
    return res.status(500).json({ error: 'Failed to fetch user last access' })
  }
}

export default withAuth(handler)
