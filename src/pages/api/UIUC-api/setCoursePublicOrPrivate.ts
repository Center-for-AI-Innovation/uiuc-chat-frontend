import type { NextApiRequest, NextApiResponse } from 'next'
import { CourseMetadata } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const course_name = req.query.course_name as string
  const is_private = req.query.is_private === 'true'

  try {
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
