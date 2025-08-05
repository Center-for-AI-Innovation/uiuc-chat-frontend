import { getBackendUrl } from '~/utils/apiUtils'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { project_name, project_description, project_owner_email } = req.body

  if (!project_name || !project_owner_email) {
    return res.status(400).json({ 
      error: 'project_name and project_owner_email are required' 
    })
  }

  const requestBody = {
    project_name: project_name,
    project_description: project_description,
    project_owner_email: project_owner_email,
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
      console.error('Failed to create the project. Err status:', response.status)
      return res.status(response.status).json({ 
        error: `Failed to create the project. Status: ${response.status}` 
      })
    }
    
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error creating project:', error)
    return res.status(500).json({ 
      error: 'Internal server error while creating project' 
    })
  }
}

// Helper function for backward compatibility
export const createProject = async (
  project_name: string,
  project_description: string | undefined,
  project_owner_email: string,
  is_private = false
): Promise<boolean> => {
  try {
    const response = await fetch('/api/UIUC-api/createProject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_name,
        project_description,
        project_owner_email,
        is_private
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to create the project. Err status:', response.status)
      return false
    }
    
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
