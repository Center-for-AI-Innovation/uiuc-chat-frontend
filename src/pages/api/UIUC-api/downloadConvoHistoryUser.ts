import { getBackendUrl } from '~/utils/apiUtils'
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'

interface DownloadResult {
  message: string
}

export default withAuth(handler)

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

  const { userEmail, projectName } = req.query

  // Input validation
  if (!userEmail || !projectName) {
    return res.status(400).json({ error: 'Missing userEmail or projectName' })
  }

  if (typeof userEmail !== 'string' || typeof projectName !== 'string') {
    return res
      .status(400)
      .json({ error: 'userEmail and projectName must be strings' })
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

// Client-side function - calls the API endpoint above
export const downloadConversationHistoryUser = async (
  userEmail: string,
  projectName: string,
): Promise<DownloadResult> => {
  // Input validation on client side
  if (!userEmail || !projectName) {
    return { message: 'Missing email or project name.' }
  }

  console.log(
    `Starting download for user: ${userEmail}, project: ${projectName}`,
  )

  try {
    const response = await fetch(
      `/api/UIUC-api/downloadConvoHistoryUser?userEmail=${encodeURIComponent(userEmail)}&projectName=${encodeURIComponent(projectName)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/zip, application/json, */*',
        },
      },
    )

    console.log('Received response:', response.status, response.statusText)

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Server error (${response.status})`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      console.error('Server error:', errorMessage)
      return { message: `Error: ${errorMessage}` }
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      console.log('Response is JSON')
      const jsonData = await response.json()
      console.log('Parsed JSON data:', jsonData)

      if (jsonData.response === 'Download from S3') {
        console.log(
          'Large conversation history, sending email with download link',
        )
        return {
          message:
            "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
        }
      } else if (jsonData.error) {
        return { message: `Error: ${jsonData.error}` }
      } else {
        console.log('Conversation history ready for download')
        return {
          message: 'Your conversation history is ready for download.',
        }
      }
    } else if (contentType.includes('application/zip')) {
      console.log('Response is a ZIP file')
      const blob = await response.blob()

      // Validate blob size (basic sanity check)
      if (blob.size === 0) {
        return { message: 'Error: Received empty file.' }
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Sanitize filename for security
      const sanitizedProjectName = projectName
        .replace(/[^a-zA-Z0-9\-_]/g, '_')
        .substring(0, 10)
      link.setAttribute('download', `${sanitizedProjectName}-convos.zip`)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('Download started, check your downloads')
      return { message: 'Downloading now, check your downloads.' }
    } else {
      console.warn('Unexpected content type:', contentType)
      return { message: 'Unexpected response format from server.' }
    }
  } catch (error) {
    console.error('Error exporting documents:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your connection and try again.',
      }
    }

    return { message: 'Error exporting documents. Please try again.' }
  }
}
