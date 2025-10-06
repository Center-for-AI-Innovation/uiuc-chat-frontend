import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

// export const runtime = "edge";
// doesn't seem to work...

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const { course_name } = req.body

  try {
    const redisClient = await ensureRedisConnected()
    await redisClient.set(course_name, 'true')
    res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
