// ~/src/pages/api/UIUC-api/getAllCourseNames.ts
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const redisClient = await ensureRedisConnected()
    const all_course_names = await redisClient.hKeys('course_metadatas')
    return res.status(200).json({ all_course_names })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false })
  }
}

export default withAuth(handler)
