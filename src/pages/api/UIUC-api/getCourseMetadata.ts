// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
import { type NextApiResponse } from 'next'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import { type CourseMetadata } from '~/types/courseMetadata'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

export const getCourseMetadata = async (
  course_name: string,
): Promise<CourseMetadata | null> => {
  try {
    const redisClient = await ensureRedisConnected()
    const rawMetadata = await redisClient.hGet('course_metadatas', course_name)
    const course_metadata: CourseMetadata | null = rawMetadata
      ? JSON.parse(rawMetadata)
      : null

    // Use value as-is; Redis-stored JSON should already have correct boolean
    return course_metadata
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

export default withCourseAccessFromRequest('any')(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const course_name = req.query.course_name as string
  const course_metadata = await getCourseMetadata(course_name)

  try {
    if (course_metadata == null) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }
    res.status(200).json({ course_metadata: course_metadata })
  } catch (error) {
    console.log('Error occurred while fetching courseMetadata', error)
    res.status(500).json({ success: false, error: error })
  }
}
