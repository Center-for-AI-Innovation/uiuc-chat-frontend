// ~/src/pages/api/UIUC-api/getAllCourseMetadata.ts
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import type { CourseMetadata } from '~/types/courseMetadata'
import { ensureRedisConnected } from '~/utils/redisClient'

export const getCoursesByOwnerOrAdmin = async (
  currUserEmail: string,
): Promise<{ [key: string]: CourseMetadata }[]> => {
  let all_course_metadata_raw: { [key: string]: string } | null = null
  try {
    const redisClient = await ensureRedisConnected()
    all_course_metadata_raw = await redisClient.hGetAll('course_metadatas')
    if (!all_course_metadata_raw) {
      console.error('No course metadata found for ANY course!')
      return []
    }

    const course_metadatas = Object.entries(all_course_metadata_raw).reduce(
      (acc, [key, value]) => {
        let courseMetadata: CourseMetadata | null = null
        try {
          courseMetadata = JSON.parse(value) as CourseMetadata
          if (
            courseMetadata.course_owner &&
            courseMetadata.course_admins &&
            (courseMetadata.course_owner === currUserEmail ||
              courseMetadata.course_admins.includes(currUserEmail))
          ) {
            acc.push({ [key]: courseMetadata })
          }
        } catch (parseError) {
          console.error('Invalid course metadata:', courseMetadata, key, value)
          console.error('Parse error:', parseError)
        }
        return acc
      },
      [] as { [key: string]: CourseMetadata }[],
    )

    return course_metadatas
  } catch (error) {
    console.error(
      'Error occurred while fetching courseMetadata',
      error,
      all_course_metadata_raw,
    )
    return []
  }
}

export default withAuth(handler)

export const getAllCourseMetadata = async (): Promise<
  { [key: string]: CourseMetadata }[]
> => {
  let all_course_metadata_raw: { [key: string]: string } | null = null
  try {
    const redisClient = await ensureRedisConnected()
    all_course_metadata_raw = await redisClient.hGetAll('course_metadatas')
    if (!all_course_metadata_raw) {
      console.error('No course metadata found for ANY course!')
      return []
    }

    const all_course_metadata = Object.entries(all_course_metadata_raw).map(
      ([key, value]) => {
        return { [key]: JSON.parse(value) as CourseMetadata }
      },
    )
    console.log('all_course_metadata', all_course_metadata)

    return all_course_metadata
  } catch (error) {
    console.error(
      'Error occurred while fetching courseMetadata',
      error,
      all_course_metadata_raw,
    )
    return []
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const currUserEmail = req.user?.email
    if (!currUserEmail) {
      console.error('No email found in token')
      return res.status(400).json({ error: 'No email found in token' })
    }
    const all_course_metadata = await getCoursesByOwnerOrAdmin(currUserEmail)
    return res.status(200).json(all_course_metadata)
  } catch (error) {
    console.log('Error occurred while fetching courseMetadata', error)
    return res.status(500).json({ success: false, error: error })
  }
}
