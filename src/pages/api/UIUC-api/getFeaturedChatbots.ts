import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import type { CourseMetadata } from '~/types/courseMetadata'
import type { ChatbotCardData } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { db, courseMetadata } from '~/db/dbClient'
import { sql } from 'drizzle-orm'
import { toChatbotCardData } from '~/utils/chatbotCard'

/**
 * Returns the curated set of chatbots shown on the default `/chatbots` page.
 *
 * App admins will eventually hand-pick which chatbots are surfaced here. Until
 * that curation UI / storage exists, this endpoint stands in by returning a
 * fixed-size random sample of public, non-frozen chatbots from the
 * `course_metadata` table.
 */

const FEATURED_LIMIT = 20

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userEmail = req.user?.email
  if (!userEmail) {
    return res.status(400).json({ error: 'No email found in token' })
  }

  try {
    // Public, non-frozen chatbots only. App admins will narrow this further
    // once the curation feature lands.
    const rows = await db
      .select({
        course_name: courseMetadata.course_name,
        raw_metadata: courseMetadata.raw_metadata,
      })
      .from(courseMetadata)
      .where(
        sql`${courseMetadata.is_frozen} = false AND ${courseMetadata.is_private} = false`,
      )
      .orderBy(sql`RANDOM()`)
      .limit(FEATURED_LIMIT)

    const results: ChatbotCardData[] = rows.map((row) =>
      toChatbotCardData(
        row.course_name,
        row.raw_metadata as CourseMetadata,
        userEmail,
      ),
    )

    return res.status(200).json({ results, total: results.length })
  } catch (error) {
    console.error(
      'Error in getFeaturedChatbots:',
      error instanceof Error ? error.message : String(error),
    )
    return res.status(500).json({ error: 'Failed to fetch featured chatbots' })
  }
}

export default withAuth(handler)
