import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name, s3_path, url } = req.query

  if (!course_name) {
    return res.status(400).json({
      error: 'course_name parameter is required',
    })
  }

  // Ensure course_name is a string
  const courseName = Array.isArray(course_name) ? course_name[0] : course_name
  if (!courseName) {
    return res.status(400).json({
      error: 'course_name parameter is required',
    })
  }

  if (!s3_path && !url) {
    return res.status(400).json({
      error: 's3_path or url parameter is required',
    })
  }

  // Ensure s3_path and url are strings
  const s3Path = Array.isArray(s3_path) ? s3_path[0] : s3_path
  const urlParam = Array.isArray(url) ? url[0] : url

  try {
    const params = new URLSearchParams()
    params.append('course_name', courseName)
    if (s3Path) params.append('s3_path', s3Path)
    if (urlParam) params.append('url', urlParam)

    const response = await fetch(
      `${getBackendUrl()}/delete?${params.toString()}`,
      {
        method: 'DELETE',
      },
    )

    if (!response.ok) {
      console.error('Failed to delete document. Err status:', response.status)
      return res.status(response.status).json({
        error: `Failed to delete document. Status: ${response.status}`,
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error deleting document:', error)
    return res.status(500).json({
      error: 'Internal server error while deleting document',
    })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
