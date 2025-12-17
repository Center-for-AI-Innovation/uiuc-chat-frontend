import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { db } from '~/db/dbClient'
import { projects } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const { course_name } = req.query as { course_name: string }

  if (!course_name) {
    return res.status(400).json({ error: 'course_name is required' })
  }

  try {
    const data = await db
      .select({
        sim_api_key: projects.sim_api_key,
        sim_workflow_ids: projects.sim_workflow_ids,
      })
      .from(projects)
      .where(eq(projects.course_name, course_name))
      .limit(1)

    if (data.length === 0) {
      return res.status(200).json({
        sim_api_key: null,
        sim_workflow_ids: null,
      })
    }

    return res.status(200).json(data[0])
  } catch (error: any) {
    console.error('Error getting Sim config:', error)
    return res.status(500).json({ error: error.message })
  }
}

export default withCourseAccessFromRequest('any')(handler)
