// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { type CourseMetadata } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export const getCourseMetadata = async (
  course_name: string,
): Promise<CourseMetadata | null> => {
  try {
    const rawMetadata = await redisClient.hGet('course_metadatas', course_name)
    const course_metadata: CourseMetadata = rawMetadata
      ? JSON.parse(rawMetadata)
      : null
    return course_metadata
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const course_name = req.query.course_name as string
  const course_metadata = await getCourseMetadata(course_name)

  try {
    if (course_metadata == null) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    if (course_metadata.hasOwnProperty('is_private')) {
      course_metadata.is_private = JSON.parse(
        course_metadata.is_private as unknown as string,
      )
    }
    res.status(200).json({ course_metadata: course_metadata })
  } catch (error) {
    console.log('Error occurred while fetching courseMetadata', error)
    res.status(500).json({ success: false, error: error })
  }
}
