import axios from 'axios'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { getBackendUrl } from '~/utils/apiUtils'

interface DownloadResult {
  message: string
}

// Server-side API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name } = req.query

  if (!course_name || typeof course_name !== 'string') {
    return res.status(400).json({ 
      error: 'course_name parameter is required' 
    })
  }

  try {
    const backendUrl = `${getBackendUrl()}/export-convo-history`;
    const response = await axios.get(backendUrl, {
      params: { course_name },
      responseType: 'arraybuffer',
    });

    // Check content type from response headers
    const contentType = String(response.headers['content-type'] || '').toLowerCase()

    if (contentType === 'application/json') {
      // Handle JSON response (S3 download case)
      // In Node.js, response.data is a Buffer when responseType is 'blob'
      const jsonText = response.data.toString('utf-8')
      const jsonData = JSON.parse(jsonText)
      
      if (jsonData.response === 'Download from S3') {
        return res.status(200).json({
          message: "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
        })
      } else {
        return res.status(200).json({
          message: 'Your conversation history is ready for download.',
        })
      }
    } else if (contentType === 'application/zip') {
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="${course_name.substring(0, 10)}-convos.zip"`)

      return res.status(200).send(Buffer.from(response.data))
    } else {
      // Handle unexpected content types
      console.log('Unexpected content type:', contentType)
      return res.status(500).json({ message: `Unexpected response format from backend: ${contentType}` })
    }
  } catch (error) {
    console.error('Error exporting conversation history:', error)
    return res.status(500).json({ message: 'Error exporting conversation history.' })
  }
}

// Client-side function for downloading conversation history
export const downloadConversationHistory = async (
  courseName: string,
): Promise<DownloadResult> => {
  try {
    const response = await fetch(
      `/api/UIUC-api/downloadConvoHistory?course_name=${courseName}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return { message: errorData.message || 'Error downloading conversation history.' }
    }

    // Check if it's a JSON response or a file download
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      // Handle JSON response (S3 download case or error)
      const data = await response.json()
      return { message: data.message }
    } else if (contentType && contentType.includes('application/zip')) {
      // Handle ZIP file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', courseName.substring(0, 10) + '-convos.zip')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return { message: 'Downloading now, check your downloads.' }
    } else {
      return { message: 'Unexpected response format.' }
    }
  } catch (error) {
    console.error('Error downloading conversation history:', error)
    return { message: 'Error downloading conversation history.' }
  }
}
