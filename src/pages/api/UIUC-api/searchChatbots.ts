import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import type { CourseMetadata } from '~/types/courseMetadata'
import type { ChatbotCardData } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { ensureRedisConnected } from '~/utils/redisClient'

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? ''
const MAX_QUERY_LENGTH = 200

const VALID_PRIVACY_VALUES = new Set(['public', 'private', 'logged_in'])

type PrivacyFilter = 'public' | 'private' | 'logged_in'

function getAccessLevel(
  metadata: CourseMetadata,
): 'public' | 'private' | 'logged_in' {
  if (!metadata.is_private) return 'public'
  if (metadata.allow_logged_in_users) return 'logged_in'
  return 'private'
}

function matchesPrivacyFilter(
  metadata: CourseMetadata,
  privacy: PrivacyFilter,
): boolean {
  return getAccessLevel(metadata) === privacy
}

function matchesTextQuery(
  courseName: string,
  metadata: CourseMetadata,
  query: string,
): boolean {
  const lowerQuery = query.toLowerCase()
  return (
    courseName.toLowerCase().includes(lowerQuery) ||
    (metadata.project_description ?? '').toLowerCase().includes(lowerQuery) ||
    (metadata.course_owner ?? '').toLowerCase().includes(lowerQuery)
  )
}

function isUserBot(metadata: CourseMetadata, userEmail: string): boolean {
  return (
    metadata.course_owner === userEmail ||
    (metadata.course_admins ?? []).includes(userEmail)
  )
}

/** Check whether the user is allowed to see this bot at all. */
function canUserView(metadata: CourseMetadata, userEmail: string): boolean {
  // Public bots are visible to everyone
  if (!metadata.is_private) return true
  // "Logged-in users" bots are visible to any authenticated user
  if (metadata.allow_logged_in_users) return true
  // Private bots: only owner, admins, or approved users
  if (isUserBot(metadata, userEmail)) return true
  if ((metadata.approved_emails_list ?? []).includes(userEmail)) return true
  return false
}

/** Build a safe card payload — never include raw metadata or secrets. */
function toCardData(
  courseName: string,
  metadata: CourseMetadata,
  userEmail: string,
): ChatbotCardData {
  const isOwner = metadata.course_owner === userEmail
  const admins = (metadata.course_admins ?? []).filter(
    (a) => a !== metadata.course_owner && a !== DEFAULT_ADMIN_EMAIL,
  )

  const accessLevel = getAccessLevel(metadata)

  return {
    course_name: courseName,
    title: courseName,
    description: metadata.project_description ?? '',
    owner: isOwner ? 'You' : metadata.course_owner,
    collaboratorCount: admins.length,
    userRole: isOwner
      ? 'owner'
      : isUserBot(metadata, userEmail)
        ? 'member'
        : undefined,
    accessLevel: accessLevel === 'logged_in' ? 'unlisted' : accessLevel,
    isPrivate: metadata.is_private,
    bannerImageS3: metadata.banner_image_s3,
  }
}

function normalizeIsPrivate(metadata: CourseMetadata): CourseMetadata {
  if (typeof metadata.is_private === 'string') {
    return {
      ...metadata,
      is_private:
        (metadata.is_private as unknown as string).toLowerCase() === 'true',
    }
  }
  return metadata
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userEmail = req.user?.email
  if (!userEmail) {
    return res.status(400).json({ error: 'No email found in token' })
  }

  const q =
    typeof req.query.q === 'string'
      ? req.query.q.trim().slice(0, MAX_QUERY_LENGTH)
      : ''

  const category =
    typeof req.query.category === 'string' ? req.query.category : undefined

  const rawPrivacy =
    typeof req.query.privacy === 'string' ? req.query.privacy : undefined
  if (rawPrivacy && !VALID_PRIVACY_VALUES.has(rawPrivacy)) {
    return res
      .status(400)
      .json({ error: `Invalid privacy value: ${rawPrivacy}` })
  }
  const privacy = rawPrivacy as PrivacyFilter | undefined

  const myBots = req.query.my_bots === 'true'

  try {
    const redisClient = await ensureRedisConnected()
    const allRaw = await redisClient.hGetAll('course_metadatas')

    if (!allRaw) {
      return res.status(200).json({ results: [], total: 0 })
    }

    const results: ChatbotCardData[] = []

    for (const [courseName, rawValue] of Object.entries(allRaw)) {
      let metadata: CourseMetadata
      try {
        metadata = normalizeIsPrivate(JSON.parse(rawValue) as CourseMetadata)
      } catch {
        continue
      }

      // Skip frozen/archived
      if (metadata.is_frozen === true) continue

      // Access control: only show bots the user is authorized to view
      if (!canUserView(metadata, userEmail)) continue

      // Filter: my_bots
      if (myBots && !isUserBot(metadata, userEmail)) continue

      // Filter: privacy
      if (privacy && !matchesPrivacyFilter(metadata, privacy)) continue

      // Filter: category (project_type) — ready for when #598 lands.
      // For now project_type doesn't exist in CourseMetadata,
      // so this filter will be a no-op until the field is added.
      if (category) {
        const projectType = (metadata as unknown as Record<string, unknown>)[
          'project_type'
        ] as string | undefined
        if (projectType && projectType !== category) continue
      }

      // Filter: text query
      if (q && !matchesTextQuery(courseName, metadata, q)) continue

      results.push(toCardData(courseName, metadata, userEmail))
    }

    // Sort: user's own bots first, then alphabetically
    results.sort((a, b) => {
      const aRank = a.userRole === 'owner' ? 0 : a.userRole === 'member' ? 1 : 2
      const bRank = b.userRole === 'owner' ? 0 : b.userRole === 'member' ? 1 : 2
      if (aRank !== bRank) return aRank - bRank
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    })

    return res.status(200).json({ results, total: results.length })
  } catch (error) {
    console.error(
      'Error in searchChatbots:',
      error instanceof Error ? error.message : String(error),
    )
    return res.status(500).json({ error: 'Failed to search chatbots' })
  }
}

export default withAuth(handler)
