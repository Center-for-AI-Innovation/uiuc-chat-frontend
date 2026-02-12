import { useMutation } from '@tanstack/react-query'

export type DownloadConvoHistoryRequest = {
  projectName: string
}

export type DownloadConvoHistoryResult = {
  message: string
}

async function downloadConvoHistory({
  projectName,
}: DownloadConvoHistoryRequest): Promise<DownloadConvoHistoryResult> {
  const response = await fetch(
    `/api/UIUC-api/downloadConvoHistoryUser?projectName=${encodeURIComponent(projectName)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/zip, application/json, */*',
      },
    },
  )

  console.log('Received response:', response.status, response.statusText)

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
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

    if (blob.size === 0) {
      return { message: 'Error: Received empty file.' }
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

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
}

export function useDownloadConvoHistory() {
  return useMutation({
    mutationKey: ['downloadConvoHistory'],
    mutationFn: downloadConvoHistory,
    onError: (error) => {
      console.error('Error exporting documents:', error)
    },
  })
}
