import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { type CourseMetadata } from '~/types/courseMetadata'
import { ensureRedisConnected } from '~/utils/redisClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const course_name = req.body.course_name as string
  const is_private = req.body.is_private === 'true'

  try {
    const redisClient = await ensureRedisConnected()
    const course_metadata_string = await redisClient.hGet(
      'course_metadatas',
      course_name,
    )

    if (!course_metadata_string) throw new Error('Course metadata not found')
    const course_metadata: CourseMetadata = JSON.parse(course_metadata_string)

    if (!course_metadata) {
      return res.status(500).json({ success: false })
    }

    const updated_course_metadata: CourseMetadata = {
      ...course_metadata,
      is_private,
    }

    await redisClient.hSet('course_metadatas', {
      [course_name]: JSON.stringify(updated_course_metadata),
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    console.log(error)
    console.log('removeUserFromCourse FAILURE')
    return res.status(500).json({ success: false })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
