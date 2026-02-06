import { getBaseUrl } from '~/utils/apiUtils'

export async function fetchPresignedUrl(
  filePath: string,
  courseName?: string,
  page?: string,
  fileName?: string,
): Promise<string | null> {
  try {
    const endpoint = `${getBaseUrl()}/api/download`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, courseName, page, fileName }),
    })

    if (!response.ok)
      throw new Error(`Server responded with status code ${response.status}`)
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error fetching presigned URL', { error })
    return null
  }
}
