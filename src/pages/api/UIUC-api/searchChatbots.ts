import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import type { CourseMetadata } from '~/types/courseMetadata'
import type { ChatbotCardData } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { db, courseMetadata } from '~/db/dbClient'
import { sql } from 'drizzle-orm'
import { sanitizeChatbotTags } from '~/types/chatbotTags'
import { compareChatbotTagPrecedence } from '~/utils/chatbotTagSort'

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? ''
const MAX_QUERY_LENGTH = 200
const MAX_RESULTS = 500

const VALID_PRIVACY_VALUES = new Set(['public', 'private', 'logged_in'])

type PrivacyFilter = 'public' | 'private' | 'logged_in'

function getAccessLevel(
  metadata: CourseMetadata,
): 'public' | 'private' | 'logged_in' {
  if (!metadata.is_private) return 'public'
  if (metadata.allow_logged_in_users) return 'logged_in'
  return 'private'
}

function isUserBot(metadata: CourseMetadata, userEmail: string): boolean {
  return (
    metadata.course_owner === userEmail ||
    (metadata.course_admins ?? []).includes(userEmail)
  )
}

/** Build a safe card payload — only attach raw metadata for bots the caller owns or admins. */
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
  const callerIsUserBot = isUserBot(metadata, userEmail)

  const tags = sanitizeChatbotTags(metadata.tags)
  const organization = tags.find((t) => t.category === 'organization')?.value
  const projectType = tags.find((t) => t.category === 'projectType')?.value

  return {
    course_name: courseName,
    title: courseName,
    description: metadata.project_description ?? '',
    organization,
    projectType,
    owner: isOwner ? 'You' : metadata.course_owner,
    collaboratorCount: admins.length,
    userRole: isOwner ? 'owner' : callerIsUserBot ? 'member' : undefined,
    accessLevel: accessLevel === 'logged_in' ? 'unlisted' : accessLevel,
    isPrivate: metadata.is_private,
    bannerImageS3: metadata.banner_image_s3,
    metadata: callerIsUserBot ? metadata : undefined,
  }
}

/** Rank a card by user-role tier: owner=0, admin=1, other=2. */
function userTier(metadata: CourseMetadata, userEmail: string): number {
  if (metadata.course_owner === userEmail) return 0
  if ((metadata.course_admins ?? []).includes(userEmail)) return 1
  return 2
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

  // Tags filter: comma-separated list of tag values (e.g., "Course,Grainger Engineering").
  // Matches any row whose tags jsonb array contains at least one of the given values.
  const rawTags = typeof req.query.tags === 'string' ? req.query.tags : ''
  const tagValues = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10)

  try {
    // Access predicate: user can see bots where
    //   is_frozen = false AND (
    //     is_private = false OR allow_logged_in_users = true
    //     OR course_owner = :email OR :email = ANY(course_admins)
    //     OR :email = ANY(approved_emails_list)
    //   )
    const accessPredicate = sql`
      ${courseMetadata.is_frozen} = false
      AND (
        ${courseMetadata.is_private} = false
        OR ${courseMetadata.allow_logged_in_users} = true
        OR ${courseMetadata.course_owner} = ${userEmail}
        OR ${userEmail} = ANY(${courseMetadata.course_admins})
        OR ${userEmail} = ANY(${courseMetadata.approved_emails_list})
      )
    `

    const textPredicate = q
      ? sql`AND (
          ${courseMetadata.course_name} ILIKE ${'%' + q + '%'}
          OR ${courseMetadata.project_description} ILIKE ${'%' + q + '%'}
          OR ${courseMetadata.course_owner} ILIKE ${'%' + q + '%'}
        )`
      : sql``

    const privacyPredicate = privacy
      ? sql`AND (
          (${privacy} = 'public' AND ${courseMetadata.is_private} = false)
          OR (${privacy} = 'logged_in' AND ${courseMetadata.is_private} = true AND ${courseMetadata.allow_logged_in_users} = true)
          OR (${privacy} = 'private' AND ${courseMetadata.is_private} = true AND ${courseMetadata.allow_logged_in_users} = false)
        )`
      : sql``

    const myBotsPredicate = myBots
      ? sql`AND (
          ${courseMetadata.course_owner} = ${userEmail}
          OR ${userEmail} = ANY(${courseMetadata.course_admins})
        )`
      : sql``

    // Tag predicate: ANY of the provided values matches ANY tag in the array.
    // Uses jsonb_array_elements to flatten tags, then checks t->>'value'.
    const tagsPredicate =
      tagValues.length > 0
        ? sql`AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(${courseMetadata.tags}) t
            WHERE (t->>'value') = ANY(${tagValues}::text[])
          )`
        : sql``

    // Category maps to tags with category='projectType' when #598 is merged.
    // Until then, treat it as a no-op so callers don't break.
    const categoryPredicate = category
      ? sql`AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(${courseMetadata.tags}) t
          WHERE (t->>'category') = 'projectType' AND (t->>'value') = ${category}
        )`
      : sql``

    // Ranked ordering: user's own bots first (owner=0, admin=1), then alphabetical.
    const rankOrder = sql`
      CASE
        WHEN ${courseMetadata.course_owner} = ${userEmail} THEN 0
        WHEN ${userEmail} = ANY(${courseMetadata.course_admins}) THEN 1
        ELSE 2
      END,
      LOWER(${courseMetadata.course_name})
    `

    const rows = await db
      .select({
        course_name: courseMetadata.course_name,
        raw_metadata: courseMetadata.raw_metadata,
      })
      .from(courseMetadata)
      .where(
        sql`${accessPredicate} ${textPredicate} ${privacyPredicate} ${myBotsPredicate} ${tagsPredicate} ${categoryPredicate}`,
      )
      .orderBy(rankOrder)
      .limit(MAX_RESULTS)

    // Build cards, then re-sort: keep user-tier (owner > admin > other) as the
    // primary key, but within each tier order by chatbot tag precedence
    // (organization-tagged ahead of projectType-tagged, untagged last;
    // alphabetical course name as a final tiebreaker).
    const cards = rows.map((row) => {
      const metadata = row.raw_metadata as CourseMetadata
      return {
        tier: userTier(metadata, userEmail),
        card: toCardData(row.course_name, metadata, userEmail),
        tags: sanitizeChatbotTags(metadata.tags),
      }
    })

    cards.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      const byTag = compareChatbotTagPrecedence(a.tags, b.tags)
      if (byTag !== 0) return byTag
      return a.card.course_name.localeCompare(b.card.course_name)
    })

    const results: ChatbotCardData[] = cards.map((c) => c.card)

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
