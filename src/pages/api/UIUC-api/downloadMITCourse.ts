import { getBackendUrl } from '~/utils/apiUtils'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, course_name, local_dir } = req.query

  if (!url || !course_name || !local_dir) {
    return res.status(400).json({ 
      error: 'url, course_name, and local_dir parameters are required' 
    })
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/mit-download?url=${encodeURIComponent(url)}&course_name=${encodeURIComponent(course_name)}&local_dir=${encodeURIComponent(local_dir)}`,
    )

    if (!response.ok) {
      console.error('Failed to download MIT course. Err status:', response.status)
      return res.status(response.status).json({ 
        error: `Failed to download MIT course. Status: ${response.status}` 
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error downloading MIT course:', error)
    return res.status(500).json({ 
      error: 'Internal server error while downloading MIT course' 
    })
  }
}