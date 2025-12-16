import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { checkCourseExists } from './getCourseExists'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { project_name, project_description, project_owner_email, is_private } =
    req.body

  if (!project_name || !project_owner_email) {
    return res.status(400).json({
      error: 'project_name and project_owner_email are required',
    })
  }

  // Server-side validation: Check if project name already exists
  // This prevents race conditions where a user could bypass client-side validation
  try {
    const projectExists = await checkCourseExists(project_name)

    if (projectExists) {
      return res.status(409).json({
        error: 'Project name already exists',
        message: `A project with the name "${project_name}" already exists. Please choose a different name.`,
      })
    }
  } catch (error) {
    console.error('Error checking project name availability:', error)
    // If Redis check fails, we must fail the request to prevent data inconsistency
    // Allowing project creation when Redis is down would lead to out-of-sync data
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Unable to validate project name. Please contact support.',
    })
  }

  const requestBody = {
    project_name: project_name,
    project_description: project_description,
    project_owner_email: project_owner_email,
    is_private: is_private,
  }

  try {
    const response = await fetch(`${getBackendUrl()}/createProject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error(
        'Failed to create the project. Err status:',
        response.status,
      )
      return res.status(response.status).json({
        error: `Failed to create the project. Status: ${response.status}`,
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error creating project:', error)
    return res.status(500).json({
      error: 'Internal server error while creating project',
    })
  }
}

export default withAuth(handler)
