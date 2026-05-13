import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { db, chatbotTags } from '~/db/dbClient'
import { sql } from 'drizzle-orm'

const VALID_CATEGORIES = new Set(['general', 'organization', 'projectType'])
const DEFAULT_CATEGORY = 'general'
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 25
const MAX_QUERY_LENGTH = 64

export type TagSuggestion = {
  value: string
  usage_count: number
}

export type SearchTagsResponse = {
  results: TagSuggestion[]
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userEmail = req.user?.email
  if (!userEmail) {
    return res.status(400).json({ error: 'No email found in token' })
  }

  const rawCategory =
    typeof req.query.category === 'string'
      ? req.query.category
      : DEFAULT_CATEGORY
  if (!VALID_CATEGORIES.has(rawCategory)) {
    return res.status(400).json({ error: `Invalid category: ${rawCategory}` })
  }

  const q =
    typeof req.query.q === 'string'
      ? req.query.q.trim().slice(0, MAX_QUERY_LENGTH)
      : ''
  const qLower = q.toLowerCase()

  const rawLimit = Number.parseInt(
    typeof req.query.limit === 'string' ? req.query.limit : '',
    10,
  )
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT

  try {
    // Prefix match on value_lower (more useful for autocomplete than substring).
    // Most-used tags surface first; alphabetical as the tiebreaker.
    const prefixPredicate = qLower
      ? sql`AND ${chatbotTags.value_lower} LIKE ${qLower + '%'}`
      : sql``

    const rows = await db
      .select({
        value: chatbotTags.value,
        usage_count: chatbotTags.usage_count,
      })
      .from(chatbotTags)
      .where(sql`${chatbotTags.category} = ${rawCategory} ${prefixPredicate}`)
      .orderBy(
        sql`${chatbotTags.usage_count} DESC, ${chatbotTags.value_lower} ASC`,
      )
      .limit(limit)

    const results: TagSuggestion[] = rows.map((r) => ({
      value: r.value,
      usage_count: r.usage_count,
    }))

    return res.status(200).json({ results })
  } catch (error) {
    console.error(
      'Error in searchTags:',
      error instanceof Error ? error.message : String(error),
    )
    return res.status(500).json({ error: 'Failed to search tags' })
  }
}

export default withAuth(handler)
