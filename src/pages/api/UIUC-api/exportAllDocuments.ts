import axios from 'axios'
interface ExportResult {
  message: string
  s3_path?: string
}

export const handleExport = async (
  course_name: string,
): Promise<ExportResult> => {
  try {
    const API_URL =
      'https://flask-production-751b.up.railway.app/exportDocuments'
    const response = await axios.get(`${API_URL}?course_name=${course_name}`, {
      responseType: 'blob',
    })

    if (response.headers['content-type'] === 'application/json') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function () {
          const jsonData = JSON.parse(reader.result as string)
          console.log(jsonData)
          if (jsonData.response === 'Download from S3') {
            resolve({
              message:
                'We have started gathering your documents, you will receive an email shortly.',
              s3_path: jsonData.s3_path,
            })
          } else {
            // Handle other JSON responses appropriately
            resolve({ message: 'Your documents are ready for download.' })
          }
        }
        reader.onerror = reject
        reader.readAsText(new Blob([response.data]))
      })
    } else if (response.headers['content-type'] === 'application/zip') {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', course_name + '_documents.zip')
      document.body.appendChild(link)
      link.click()
      return { message: 'Downloading now, check your downloads.' }
    }
  } catch (error) {
    console.error('Error exporting documents:', error)
    return { message: 'Error exporting documents.' }
  }
  return { message: 'Unexpected error occurred.' }
}
