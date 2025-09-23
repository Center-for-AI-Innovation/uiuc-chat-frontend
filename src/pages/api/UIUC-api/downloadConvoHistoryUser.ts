import { getBackendUrl } from '~/utils/apiUtils'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest} from '~/utils/authMiddleware'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'


export default withCourseAccessFromRequest('any')(handler)

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidProjectName = (projectName: string): boolean => {
  // Allow alphanumeric, hyphens, underscores, and spaces, length 1-100
  const projectRegex = /^[a-zA-Z0-9\s\-_]{1,100}$/
  return projectRegex.test(projectName)
}

// Server-side API handler - can access environment variables
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { projectName } = req.query

  const userEmail = req.user?.email

  // Input validation
  if (!userEmail || !projectName) {
    return res.status(400).json({ error: 'Missing userEmail or projectName' })
  }

  if (typeof projectName !== 'string') {
    return res
      .status(400)
      .json({ error: 'projectName must be strings' })
  }

  if (!isValidEmail(userEmail)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  if (!isValidProjectName(projectName)) {
    return res.status(400).json({ error: 'Invalid project name format' })
  }

  console.log(
    `Starting download for user: ${userEmail}, project: ${projectName}`,
  )

  try {
    const backendUrl = getBackendUrl()
    const url = `${backendUrl}/export-convo-history-user?user_email=${encodeURIComponent(userEmail)}&project_name=${encodeURIComponent(projectName)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/zip, application/json, */*',
      },
      // Add timeout of 5 minutes for large downloads
      signal: AbortSignal.timeout(300000),
    })

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`)
      return res.status(response.status).json({
        error: `Backend error: ${response.status} ${response.statusText}`,
      })
    }

    console.log(
      'Received response:',
      response.status,
      response.headers.get('content-type'),
    )

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    // Set appropriate headers for the response
    res.setHeader('Content-Type', contentType)

    const contentDisposition = response.headers.get('content-disposition')
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition)
    }

    // Stream the response to avoid memory issues with large files
    if (response.body) {
      const reader = response.body.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(Buffer.from(value))
        }
        res.end()
      } finally {
        reader.releaseLock()
      }
    } else {
      res.status(500).json({ error: 'No response body received' })
    }
  } catch (error) {
    console.error('Error exporting documents:', error)

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return res
          .status(504)
          .json({ error: 'Request timeout - the export is taking too long' })
      }
      if (error.name === 'AbortError') {
        return res.status(408).json({ error: 'Request was aborted' })
      }
    }

    res
      .status(500)
      .json({ error: 'Internal server error while exporting documents' })
  }
}
