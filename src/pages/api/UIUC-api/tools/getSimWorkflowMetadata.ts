import { type NextApiRequest, type NextApiResponse } from 'next'
import { db } from '~/db/dbClient'
import { projects } from '~/db/schema'
import { eq } from 'drizzle-orm'

/**
 * API endpoint to get workflow metadata
 * GET /api/UIUC-api/tools/getSimWorkflowMetadata?course_name=xxx
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name } = req.query

  if (!course_name || typeof course_name !== 'string') {
    return res.status(400).json({ error: 'course_name is required' })
  }

  try {
    const result = await db
      .select({
        sim_workflow_metadata: projects.sim_workflow_metadata,
      })
      .from(projects)
      .where(eq(projects.course_name, course_name))
      .limit(1)

    if (result.length === 0) {
      return res.status(200).json({ workflow_metadata: {} })
    }

    return res.status(200).json({
      workflow_metadata: result[0].sim_workflow_metadata || {},
    })
  } catch (error) {
    console.error('Error fetching workflow metadata:', error)
    return res.status(500).json({
      error: 'Failed to fetch workflow metadata',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
