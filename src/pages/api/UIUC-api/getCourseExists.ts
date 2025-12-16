import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

/**
 * Check if a course/project name already exists in Redis
 * @param courseName - The course/project name to check
 * @returns Promise<boolean> - true if course exists, false otherwise
 * @throws Error if Redis connection fails
 */
export async function checkCourseExists(
  courseName: string,
): Promise<boolean> {
  const redisClient = await ensureRedisConnected()
  return await redisClient.hExists('course_metadatas', courseName)
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const course_name = req.query.course_name as string

  try {
    const courseExists = await checkCourseExists(course_name)
    return res.status(200).json(courseExists)
  } catch (error) {
    console.log(error)
    return res.status(500).json(false)
  }
}

export default withAuth(handler)
