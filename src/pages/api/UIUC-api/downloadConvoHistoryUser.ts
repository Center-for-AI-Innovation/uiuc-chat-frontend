import axios from 'axios'

interface DownloadResult {
  message: string
}

export const downloadConversationHistoryUser = async (
  userEmail: string,
  projectName: string,
): Promise<DownloadResult> => {
  console.log(
    `Starting download for user: ${userEmail}, project: ${projectName}`,
  )
  try {
    const response = await axios.get(
      `https://flask-production-751b.up.railway.app/export-convo-history-user?user_email=${userEmail}&project_name=${projectName}`,
      { responseType: 'blob' },
    )
    console.log('Received response:', response)

    if (response.headers['content-type'] === 'application/json') {
      console.log('Response is JSON')
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function () {
          const jsonData = JSON.parse(reader.result as string)
          console.log('Parsed JSON data:', jsonData)
          if (jsonData.response === 'Download from S3') {
            console.log(
              'Large conversation history, sending email with download link',
            )
            resolve({
              message:
                "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
            })
          } else {
            console.log('Conversation history ready for download')
            resolve({
              message: 'Your conversation history is ready for download.',
            })
          }
        }
        reader.onerror = (error) => {
          console.error('Error reading blob as text:', error)
          reject(error)
        }
        reader.readAsText(new Blob([response.data]))
      })
    } else if (response.headers['content-type'] === 'application/zip') {
      console.log('Response is a ZIP file')
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        projectName.substring(0, 10) + '-convos.zip',
      )
      document.body.appendChild(link)
      link.click()
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
