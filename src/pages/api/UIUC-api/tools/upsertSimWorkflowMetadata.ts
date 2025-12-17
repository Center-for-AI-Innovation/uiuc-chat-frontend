import { type NextApiRequest, type NextApiResponse } from 'next'
import { db } from '~/db/dbClient'
import { projects } from '~/db/schema'
import { eq } from 'drizzle-orm'

/**
 * API endpoint to save workflow metadata (names and descriptions)
 * POST /api/UIUC-api/tools/upsertSimWorkflowMetadata
 * 
 * Body:
 *   - course_name: string
 *   - workflow_metadata: Record<string, { name: string, description: string }>
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name, workflow_metadata } = req.body

  if (!course_name) {
    return res.status(400).json({ error: 'course_name is required' })
  }

  if (!workflow_metadata || typeof workflow_metadata !== 'object') {
    return res.status(400).json({ error: 'workflow_metadata must be an object' })
  }

  try {
    // Get existing project
    const existingProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.course_name, course_name))
      .limit(1)

    if (existingProjects.length === 0) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Update the project with workflow metadata
    await db
      .update(projects)
      .set({
        sim_workflow_metadata: workflow_metadata,
      })
      .where(eq(projects.course_name, course_name))

    return res.status(200).json({
      success: true,
      message: 'Workflow metadata saved successfully',
    })
  } catch (error) {
    console.error('Error saving workflow metadata:', error)
    return res.status(500).json({
      error: 'Failed to save workflow metadata',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
