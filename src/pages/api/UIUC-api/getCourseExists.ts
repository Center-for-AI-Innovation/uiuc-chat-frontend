import { NextApiResponse } from 'next'
import { AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

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

export default withCourseAccessFromRequest('any')(handler)
