import axios from 'axios'
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

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
    const backendUrl = `${getBackendUrl()}/export-convo-history`
    const response = await axios.get(backendUrl, {
      params: { course_name },
      responseType: 'arraybuffer',
    })

    // Check content type from response headers
    const contentType = String(
      response.headers['content-type'] || '',
    ).toLowerCase()

    if (contentType === 'application/json') {
      // Handle JSON response (S3 download case)
      // In Node.js, response.data is a Buffer when responseType is 'blob'
      const jsonText = response.data.toString('utf-8')
      const jsonData = JSON.parse(jsonText)

      if (jsonData.response === 'Download from S3') {
        return res.status(200).json({
          message:
            "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
        })
      } else {
        return res.status(200).json({
          message: 'Your conversation history is ready for download.',
        })
      }
    } else if (contentType === 'application/zip') {
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${course_name.substring(0, 10)}-convos.zip"`,
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
    console.error('Error exporting conversation history:', error)
    return res
      .status(500)
      .json({ message: 'Error exporting conversation history.' })
  }
}
