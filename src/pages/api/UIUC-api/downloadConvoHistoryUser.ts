import axios from 'axios'
import { getBackendUrl } from '~/utils/apiUtils'
import { NextApiRequest, NextApiResponse } from 'next'

interface DownloadResult {
  message: string
}

// Server-side API handler - can access environment variables
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userEmail, projectName } = req.query

  if (!userEmail || !projectName) {
    return res.status(400).json({ error: 'Missing userEmail or projectName' })
  }

  console.log(
    `Starting download for user: ${userEmail}, project: ${projectName}`,
  )

  try {
    const response = await axios.get(
      `${getBackendUrl()}/export-convo-history-user?user_email=${userEmail}&project_name=${projectName}`,
      { responseType: 'arraybuffer' },
    )
    
    console.log('Received response:', response.status, response.headers)

    // Set appropriate headers for the response
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream')
    
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition'])
    }

    // Send the binary data
    res.send(Buffer.from(response.data))
  } catch (error) {
    console.error('Error exporting documents:', error)
    res.status(500).json({ error: 'Error exporting documents.' })
  }
}

// Client-side function - calls the API endpoint above
export const downloadConversationHistoryUser = async (
  userEmail: string,
  projectName: string,
): Promise<DownloadResult> => {
  console.log(
    `Starting download for user: ${userEmail}, project: ${projectName}`,
  )
  try {
    const response = await fetch(
      `/api/UIUC-api/downloadConvoHistoryUser?userEmail=${encodeURIComponent(userEmail)}&projectName=${encodeURIComponent(projectName)}`,
      { method: 'GET' }
    )
    
    console.log('Received response:', response)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
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
      } else {
        console.log('Conversation history ready for download')
        return {
          message: 'Your conversation history is ready for download.',
        }
      }
    } else if (contentType && contentType.includes('application/zip')) {
      console.log('Response is a ZIP file')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        projectName.substring(0, 10) + '-convos.zip',
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      console.log('Download started, check your downloads')
      return { message: 'Downloading now, check your downloads.' }
    }
  } catch (error) {
    console.error('Error exporting documents:', error)
    return { message: 'Error exporting documents.' }
  }
  console.log('Unexpected error occurred')
  return { message: 'Unexpected error occurred.' }
}
