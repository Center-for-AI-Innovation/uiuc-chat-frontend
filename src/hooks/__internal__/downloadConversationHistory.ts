export type DownloadConversationHistoryScope = 'course' | 'user'

export type DownloadConversationHistoryParams = {
  projectName: string
  scope?: DownloadConversationHistoryScope
}

export type DownloadConversationHistoryResult = {
  message: string
}

function getDownloadEndpoint({
  projectName,
  scope,
}: {
  projectName: string
  scope: DownloadConversationHistoryScope
}) {
  if (scope === 'user') {
    return `/api/UIUC-api/downloadConvoHistoryUser?projectName=${encodeURIComponent(projectName)}`
  }
  return `/api/UIUC-api/downloadConvoHistory?course_name=${encodeURIComponent(projectName)}`
}

function createDownloadFilename(projectName: string) {
  const sanitizedProjectName = projectName
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 10)
  return `${sanitizedProjectName}-convos.zip`
}

// Client-side function for downloading conversation history (course-level or user-level).
export default async function downloadConversationHistory(
  input: string | DownloadConversationHistoryParams,
): Promise<DownloadConversationHistoryResult> {
  const { projectName, scope = 'course' } =
    typeof input === 'string' ? { projectName: input, scope: 'course' } : input

  try {
    const response = await fetch(getDownloadEndpoint({ projectName, scope }), {
      method: 'GET',
      headers: {
        Accept: 'application/zip, application/json, */*',
      },
    })

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      return { message: errorMessage }
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const jsonData = await response.json()
      if (jsonData.message) {
        return { message: jsonData.message }
      }
      if (jsonData.response === 'Download from S3') {
        return {
          message:
            "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
        }
      }
      if (jsonData.error) {
        return { message: `Error: ${jsonData.error}` }
      }
      return { message: 'Your conversation history is ready for download.' }
    }

    if (contentType.includes('application/zip')) {
      const blob = await response.blob()
      if (blob.size === 0) {
        return { message: 'Error: Received empty file.' }
      }
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', createDownloadFilename(projectName))
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return { message: 'Downloading now, check your downloads.' }
    }

    return { message: 'Unexpected response format.' }
  } catch (error) {
    console.error('Error downloading conversation history:', error)
    return { message: 'Error downloading conversation history.' }
  }
}
