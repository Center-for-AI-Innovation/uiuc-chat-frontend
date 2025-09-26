import { db } from '~/db/dbClient'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { projects } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

type ApiResponse = {
  success: boolean
  api_key?: any
  error?: any
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>,
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { course_name } = req.body

  const data = await db
    .select({ n8n_api_key: projects.n8n_api_key })
    .from(projects)
    .where(eq(projects.course_name, course_name))
  if (data.length === 0) {
    console.error('No API key found for course:', course_name)
    return res
      .status(404)
      .json({ success: false, error: 'No API key found for course' })
  }
  return res.status(200).json({ success: true, api_key: data[0]?.n8n_api_key })
}

export default withCourseOwnerOrAdminAccess()(handler)
