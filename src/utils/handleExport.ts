interface ExportResult {
  message: string
  s3_path?: string
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
