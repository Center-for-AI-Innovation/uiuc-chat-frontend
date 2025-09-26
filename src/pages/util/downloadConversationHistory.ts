interface DownloadResult {
  message: string
}

// Client-side function for downloading conversation history
export const downloadConversationHistory = async (
  courseName: string,
): Promise<DownloadResult> => {
  try {
    const response = await fetch(
      `/api/UIUC-api/downloadConvoHistory?course_name=${courseName}`,
      { method: 'GET' },
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        message: errorData.message || 'Error downloading conversation history.',
      }
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
