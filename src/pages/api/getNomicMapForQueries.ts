import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'

interface NomicMapData {
  map_id: string
  map_link: string
}

export default withAuth(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { course_name, map_type } = req.query

    // Example response:  {'map_id': 'iframef4967ad7-ff37-4098-ad06-7e1e1a93dd93', 'map_link': 'https://atlas.nomic.ai/map/ed222613-97d9-46a9-8755-12bbc8a06e3a/f4967ad7-ff37-4098-ad06-7e1e1a93dd93'}
    const response = await fetch(
      `${getBackendUrl()}/getNomicMap?course_name=${course_name}&map_type=${map_type}`,
    )
    const data = await response.json()

    const parsedData: NomicMapData = {
      map_id: data.map_id,
      map_link: data.map_link,
    }
    return res.status(200).json(parsedData)
  } catch (error) {
    console.error('getNomicMapForQueries - Error fetching nomic map:', error)
    return res.status(500).json({ success: false })
  }
}
