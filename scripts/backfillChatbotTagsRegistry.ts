/**
 * One-off: seed the chatbot_tags registry from existing
 * course_metadata.tags JSONB data so autocomplete works on day one,
 * before any chatbot has been re-saved through upsertCourseMetadata.
 *
 * - Pulls every course_metadata row's tags jsonb
 * - Sanitizes through the same path the editor uses
 * - Counts distinct (category, value_lower) occurrences across all chatbots
 * - Inserts missing rows into chatbot_tags with that count as usage_count
 * - Uses ON CONFLICT DO NOTHING so already-populated rows keep whatever
 *   counter the live save path has accumulated
 *
 * Prerequisites: migration 0007_chatbot_tags must already be applied.
 *
 * Usage:
 *   pnpm tsx scripts/backfillChatbotTagsRegistry.ts            # apply
 *   pnpm tsx scripts/backfillChatbotTagsRegistry.ts --dry-run  # preview only
 */
import 'dotenv/config'
import postgres from 'postgres'
import { sanitizeChatbotTags, type ChatbotTag } from '../src/types/chatbotTags'

const DRY_RUN = process.argv.includes('--dry-run')

type TagAggregate = {
  category: string
  value: string
  value_lower: string
  usage_count: number
}

async function main() {
  const sql = postgres(
    `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_ENDPOINT}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`,
    { max: 2 },
  )

  try {
    // Pull every chatbot's tags. The course_metadata table is small (one row
    // per chatbot) so a single query is fine.
    const rows = await sql<{ course_name: string; tags: unknown }[]>`
      SELECT course_name, tags FROM course_metadata
    `
    console.log(`Scanned ${rows.length} chatbots from course_metadata`)

    // Aggregate by (category, value_lower). Keep the first non-lowercased
    // value we see so the registry preserves a readable casing.
    const byKey = new Map<string, TagAggregate>()
    let totalTagAttachments = 0
    let invalidDropped = 0

    for (const row of rows) {
      const sanitized: ChatbotTag[] = sanitizeChatbotTags(row.tags)
      const raw = Array.isArray(row.tags) ? row.tags.length : 0
      invalidDropped += Math.max(0, raw - sanitized.length)

      for (const tag of sanitized) {
        totalTagAttachments += 1
        const value_lower = tag.value.toLowerCase()
        const key = `${tag.category}::${value_lower}`
        const existing = byKey.get(key)
        if (existing) {
          existing.usage_count += 1
        } else {
          byKey.set(key, {
            category: tag.category,
            value: tag.value,
            value_lower,
            usage_count: 1,
          })
        }
      }
    }

    console.log(
      `Found ${byKey.size} distinct tags across ${totalTagAttachments} attachments` +
        (invalidDropped > 0
          ? ` (${invalidDropped} malformed entries dropped by sanitize)`
          : ''),
    )

    if (DRY_RUN) {
      const preview = [...byKey.values()]
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 20)
      console.log('Dry run — top 20 tags that would be inserted:')
      for (const tag of preview) {
        console.log(
          `  [${tag.category}] ${tag.value} (count=${tag.usage_count})`,
        )
      }
      return
    }

    if (byKey.size === 0) {
      console.log('Nothing to backfill.')
      return
    }

    // Insert in chunks so a single INSERT doesn't accumulate thousands of
    // parameters. ON CONFLICT DO NOTHING preserves any counter that the
    // live save path has already grown beyond a stale backfill snapshot.
    const CHUNK_SIZE = 200
    const all = [...byKey.values()]
    let inserted = 0

    for (let i = 0; i < all.length; i += CHUNK_SIZE) {
      const chunk = all.slice(i, i + CHUNK_SIZE)
      const result = await sql`
        INSERT INTO chatbot_tags ${sql(
          chunk,
          'category',
          'value',
          'value_lower',
          'usage_count',
        )}
        ON CONFLICT (category, value_lower) DO NOTHING
        RETURNING id
      `
      // postgres-js returns the rows from RETURNING.
      inserted += result.length
    }

    const skipped = byKey.size - inserted
    console.log(
      `Inserted ${inserted} new tag rows` +
        (skipped > 0 ? `, ${skipped} already present (left untouched)` : ''),
    )
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('Backfill chatbot tags registry failed:', err)
  process.exit(1)
})
