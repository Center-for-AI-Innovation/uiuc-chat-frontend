import { db } from '~/db/dbClient'
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { projects } from '~/db/schema'
import { eq } from 'drizzle-orm'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { course_name, sim_api_key, sim_workflow_ids } = req.body
  
  if (!course_name) {
    return res
      .status(400)
      .json({ success: false, error: 'course_name is required' })
  }

  try {
    // Check if project exists
    const existingProject = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.course_name, course_name))
      .limit(1)

    if (existingProject.length > 0) {
      // Update existing project
      await db
        .update(projects)
        .set({
          sim_api_key: sim_api_key || null,
          sim_workflow_ids: sim_workflow_ids || null,
        })
        .where(eq(projects.course_name, course_name))
      
      console.log('Updated Sim config for project:', course_name)
      return res.status(200).json({ success: true })
    } else {
      // Insert new project with Sim config
      await db
        .insert(projects)
        .values({
          course_name: course_name,
          sim_api_key: sim_api_key || null,
          sim_workflow_ids: sim_workflow_ids || null,
        })
      
      console.log('Created new project with Sim config:', course_name)
      return res.status(200).json({ success: true })
    }
  } catch (error) {
    console.error('Error upserting Sim config:', error)
    return res.status(500).json({ success: false, error: String(error) })
  }
}

export default withAuth(handler)
