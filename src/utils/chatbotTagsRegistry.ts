import { sql } from 'drizzle-orm'
import { db, chatbotTags } from '~/db/dbClient'
import type { ChatbotTag } from '~/types/chatbotTags'

/**
 * Upserts a set of chatbot tags into the registry. Inserts new (category,
 * value_lower) pairs with usage_count = 1; on conflict, increments
 * usage_count and refreshes updated_at. Idempotent within a single save
 * (callers should dedupe by chatbotTagKey beforehand if needed).
 *
 * Errors are caught and logged — registry maintenance must never block a
 * chatbot save. The registry is an index for autocomplete, not a constraint.
 */
export async function upsertChatbotTags(tags: ChatbotTag[]): Promise<void> {
  if (tags.length === 0) return

  const rows = tags.map((tag) => ({
    category: tag.category,
    value: tag.value,
    value_lower: tag.value.toLowerCase(),
    usage_count: 1,
  }))

  try {
    await db
      .insert(chatbotTags)
      .values(rows)
      .onConflictDoUpdate({
        target: [chatbotTags.category, chatbotTags.value_lower],
        set: {
          usage_count: sql`${chatbotTags.usage_count} + 1`,
          updated_at: sql`now()`,
        },
      })
  } catch (error) {
    console.error(
      'Failed to upsert chatbot tags registry:',
      error instanceof Error ? error.message : String(error),
    )
  }
}
