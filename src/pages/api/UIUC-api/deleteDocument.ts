import { withAuth } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'

async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name, s3_path, url } = req.query

  if (!course_name) {
    return res.status(400).json({
      error: 'course_name parameter is required',
    })
  }

  if (!s3_path && !url) {
    return res.status(400).json({
      error: 's3_path or url parameter is required',
    })
  }

  try {
    const params = new URLSearchParams()
    params.append('course_name', course_name)
    if (s3_path) params.append('s3_path', s3_path)
    if (url) params.append('url', url)

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

export default withAuth(handler)
