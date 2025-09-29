// ~/src/pages/api/UIUC-api/getAllCourseNames.ts
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'
import { getCoursesByOwnerOrAdmin } from './getAllCourseMetadata'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const currUserEmail = req.user?.email
    if (!currUserEmail) {
      console.error('No email found in token')
      return res.status(400).json({ error: 'No email found in token' })
    }
    const all_course_metadata_raw =
      await getCoursesByOwnerOrAdmin(currUserEmail)
    // Parse the course metadata and extract course names
    const all_course_names = all_course_metadata_raw.map(
      (courseMetadataObj) => {
        return Object.keys(courseMetadataObj)[0]
      },
    )
    return res.status(200).json({ all_course_names })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false })
  }
}

export default withAuth(handler)
