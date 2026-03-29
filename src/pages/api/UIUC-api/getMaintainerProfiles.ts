import { type NextApiResponse } from 'next'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getCourseMetadata } from './getCourseMetadata'
import { getKeycloakBaseUrl } from '~/utils/authHelpers'
import { initializeKeycloakAdmin } from '~/utils/keycloakClient'
import type { MaintainerProfile } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

export default withCourseAccessFromRequest('any')(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, error: `Method ${req.method} Not Allowed` })
  }

  const course_name = req.query.course_name as string

  if (!course_name) {
    return res
      .status(400)
      .json({ success: false, error: 'course_name is required' })
  }

  const course_metadata = await getCourseMetadata(course_name)
  if (course_metadata == null) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  const { course_owner = '', course_admins = [] } = course_metadata
  const maintainers = new Set([course_owner, ...course_admins])

  try {
    const keycloakBaseUrl = getKeycloakBaseUrl()
    const adminClient = await initializeKeycloakAdmin(keycloakBaseUrl)

    const maintainerProfiles = await Promise.all(
      Array.from(maintainers)
        .sort()
        .map<Promise<MaintainerProfile>>(async (email) => {
          try {
            const [user] = await adminClient.users.find({ email })
            if (!user)
              return {
                email,
              }
            return {
              email,
              display_name: `${user.firstName || ''} ${
                user.lastName || ''
              }`.trim(),
              avatar_url: '',
            }
          } catch {
            return {
              email,
            }
          }
        }),
    )
    res.status(200).json({ success: true, profiles: maintainerProfiles })
  } catch (error) {
    console.log('Error occurred while fetching maintainer profiles', error)
    res.status(500).json({ success: false, error: error })
  }
}
