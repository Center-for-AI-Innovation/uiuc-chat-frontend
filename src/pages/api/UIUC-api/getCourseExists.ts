import { type AuthenticatedRequest, type NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const course_name = req.query.course_name as string

  try {
    const redisClient = await ensureRedisConnected()
    const courseExists = await redisClient.hExists(
      'course_metadatas',
      course_name,
    )
    return res.status(200).json(courseExists)
  } catch (error) {
    console.log(error)
    return res.status(500).json(false)
  }
}

export default withAuth(handler)
