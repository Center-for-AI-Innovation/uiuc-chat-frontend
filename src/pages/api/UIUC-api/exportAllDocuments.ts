import axios from 'axios'
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

interface ExportResult {
  message: string
  s3_path?: string
}

export default withCourseOwnerOrAdminAccess()(handler)

// Server-side API route handler
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name } = req.query

  if (!course_name || typeof course_name !== 'string') {
    return res.status(400).json({
      error: 'course_name parameter is required',
    })
  }

  try {
    const response = await axios.get(`${getBackendUrl()}/exportDocuments`, {
      params: { course_name },
      responseType: 'arraybuffer',
    })

    // Check content type from response headers
    const contentType = response.headers['content-type']

    if (contentType === 'application/json') {
      // Handle JSON response (S3 download case)
      // In Node.js, response.data is a Buffer when responseType is 'blob'
      const jsonText = response.data.toString('utf-8')
      const jsonData = JSON.parse(jsonText)

      if (jsonData.response === 'Download from S3') {
        return res.status(200).json({
          message:
            'We have started gathering your documents, you will receive an email shortly.',
          s3_path: jsonData.s3_path,
        })
      } else {
        return res.status(200).json({
          message: 'Your documents are ready for download.',
        })
      }
    } else if (contentType === 'application/zip') {
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${course_name}_documents.zip"`,
      )

      return res.status(200).send(Buffer.from(response.data))
    } else {
      // Handle unexpected content types
      console.log('Unexpected content type:', contentType)
      return res.status(500).json({
        message: `Unexpected response format from backend: ${contentType}`,
      })
    }
  } catch (error) {
    console.error('Error exporting documents:', error)
    return res.status(500).json({ message: 'Error exporting documents.' })
  }
}

// Client-side function for exporting documents
export const handleExport = async (
  course_name: string,
): Promise<ExportResult> => {
  try {
    const response = await fetch(
      `/api/UIUC-api/exportAllDocuments?course_name=${course_name}`,
      { method: 'GET' },
    )

    if (!response.ok) {
      const errorData = await response.json()
      return { message: errorData.message || 'Error exporting documents.' }
    }

    // Check if it's a JSON response or a file download
    const contentType = response.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      // Handle JSON response (S3 download case or error)
      const data = await response.json()
      return { message: data.message, s3_path: data.s3_path }
    } else if (contentType && contentType.includes('application/zip')) {
      // Handle ZIP file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', course_name + '_documents.zip')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return { message: 'Downloading now, check your downloads.' }
    } else {
      return { message: 'Unexpected response format.' }
    }
  } catch (error) {
    console.error('Error exporting documents:', error)
    return { message: 'Error exporting documents.' }
  }
}
