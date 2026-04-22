// Atomic dual-write helper for chatbot metadata.
// Redis (`course_metadatas` hash) is the source of truth;
// Postgres (`course_metadata` table) is a search-optimized projection.
//
// Ordering: Postgres first (transactional), then Redis.
// If Redis fails, the Postgres row is rolled back to its prior state
// (or deleted on create). If Postgres fails, Redis is not touched.

import { eq, sql } from 'drizzle-orm'
import { db, courseMetadata as courseMetadataTable } from '~/db/dbClient'
import { ensureRedisConnected } from '~/utils/redisClient'
import { sanitizeChatbotTags } from '~/types/chatbotTags'
import type { CourseMetadata } from '~/types/courseMetadata'

const REDIS_HASH = 'course_metadatas'

type CourseMetadataRow = typeof courseMetadataTable.$inferInsert

export class CourseMetadataWriteError extends Error {
  public readonly stage: 'postgres' | 'redis' | 'rollback'
  public readonly cause?: unknown
  constructor(
    stage: 'postgres' | 'redis' | 'rollback',
    message: string,
    cause?: unknown,
  ) {
    super(message)
    this.name = 'CourseMetadataWriteError'
    this.stage = stage
    this.cause = cause
  }
}

function toRow(
  courseName: string,
  metadata: CourseMetadata,
): CourseMetadataRow {
  const sanitizedTags = metadata.tags ? sanitizeChatbotTags(metadata.tags) : []
  const normalized: CourseMetadata = { ...metadata, tags: sanitizedTags }

  return {
    course_name: courseName,
    course_owner: normalized.course_owner ?? '',
    course_admins: normalized.course_admins ?? [],
    approved_emails_list: normalized.approved_emails_list ?? [],
    project_description: normalized.project_description ?? null,
    tags: sanitizedTags,
    is_private: Boolean(normalized.is_private),
    allow_logged_in_users: Boolean(normalized.allow_logged_in_users),
    is_frozen: Boolean(normalized.is_frozen),
    raw_metadata: normalized,
    updated_at: new Date(),
  }
}

async function readPriorRedis(courseName: string): Promise<string | null> {
  const client = await ensureRedisConnected()
  const prior = await client.hGet(REDIS_HASH, courseName)
  return prior ?? null
}

async function upsertPostgres(row: CourseMetadataRow): Promise<void> {
  await db
    .insert(courseMetadataTable)
    .values(row)
    .onConflictDoUpdate({
      target: courseMetadataTable.course_name,
      set: {
        course_owner: row.course_owner,
        course_admins: row.course_admins,
        approved_emails_list: row.approved_emails_list,
        project_description: row.project_description,
        tags: row.tags,
        is_private: row.is_private,
        allow_logged_in_users: row.allow_logged_in_users,
        is_frozen: row.is_frozen,
        raw_metadata: row.raw_metadata,
        updated_at: sql`now()`,
      },
    })
}

async function writeRedis(
  courseName: string,
  metadata: CourseMetadata,
): Promise<void> {
  const client = await ensureRedisConnected()
  await client.hSet(REDIS_HASH, {
    [courseName]: JSON.stringify(metadata),
  })
}

async function rollbackPostgres(
  courseName: string,
  priorRedisValue: string | null,
): Promise<void> {
  if (priorRedisValue === null) {
    // The row did not exist before this write — delete what we inserted.
    await db
      .delete(courseMetadataTable)
      .where(eq(courseMetadataTable.course_name, courseName))
    return
  }

  // The row existed before — restore it from the prior Redis value.
  try {
    const priorMetadata = JSON.parse(priorRedisValue) as CourseMetadata
    const priorRow = toRow(courseName, priorMetadata)
    await upsertPostgres(priorRow)
  } catch (parseErr) {
    throw new CourseMetadataWriteError(
      'rollback',
      `Could not parse prior Redis metadata to restore Postgres row for ${courseName}`,
      parseErr,
    )
  }
}

/**
 * Atomically write chatbot metadata to Postgres and Redis.
 *
 * Order: Postgres upsert → Redis hSet. If Redis fails, the Postgres row is
 * rolled back (delete-on-create, update-to-prior on update).
 *
 * Throws CourseMetadataWriteError on any failure. Callers should surface 5xx.
 */
export async function writeCourseMetadata(
  courseName: string,
  metadata: CourseMetadata,
): Promise<void> {
  if (!courseName) {
    throw new CourseMetadataWriteError('postgres', 'courseName is required')
  }

  const priorRedisValue = await readPriorRedis(courseName)
  const row = toRow(courseName, metadata)

  try {
    await upsertPostgres(row)
  } catch (err) {
    throw new CourseMetadataWriteError(
      'postgres',
      `Failed to upsert course_metadata for ${courseName}`,
      err,
    )
  }

  try {
    await writeRedis(courseName, { ...metadata, tags: row.tags as never })
  } catch (redisErr) {
    try {
      await rollbackPostgres(courseName, priorRedisValue)
    } catch (rollbackErr) {
      console.error(
        `CRITICAL: Postgres row for ${courseName} could not be rolled back after Redis write failure. ` +
          `Manual reconciliation required.`,
        { redisErr, rollbackErr },
      )
      throw new CourseMetadataWriteError(
        'rollback',
        `Redis write failed and Postgres rollback also failed for ${courseName}`,
        rollbackErr,
      )
    }
    throw new CourseMetadataWriteError(
      'redis',
      `Redis write failed for ${courseName}; Postgres rolled back`,
      redisErr,
    )
  }
}

/**
 * Atomically delete chatbot metadata from Postgres and Redis.
 * Deletes Postgres first, then Redis. If Redis fails, the Postgres row is restored.
 */
export async function deleteCourseMetadata(courseName: string): Promise<void> {
  if (!courseName) {
    throw new CourseMetadataWriteError('postgres', 'courseName is required')
  }

  const priorRedisValue = await readPriorRedis(courseName)

  // Capture prior Postgres row for rollback.
  const [priorRow] = await db
    .select()
    .from(courseMetadataTable)
    .where(eq(courseMetadataTable.course_name, courseName))
    .limit(1)

  try {
    await db
      .delete(courseMetadataTable)
      .where(eq(courseMetadataTable.course_name, courseName))
  } catch (err) {
    throw new CourseMetadataWriteError(
      'postgres',
      `Failed to delete course_metadata for ${courseName}`,
      err,
    )
  }

  if (priorRedisValue === null) {
    return // nothing to delete in Redis
  }

  try {
    const client = await ensureRedisConnected()
    await client.hDel(REDIS_HASH, courseName)
  } catch (redisErr) {
    if (priorRow) {
      try {
        await db.insert(courseMetadataTable).values(priorRow)
      } catch (rollbackErr) {
        console.error(
          `CRITICAL: Could not restore Postgres row for ${courseName} after Redis delete failure.`,
          { redisErr, rollbackErr },
        )
        throw new CourseMetadataWriteError(
          'rollback',
          `Redis delete failed and Postgres restore also failed for ${courseName}`,
          rollbackErr,
        )
      }
    }
    throw new CourseMetadataWriteError(
      'redis',
      `Redis delete failed for ${courseName}; Postgres row restored`,
      redisErr,
    )
  }
}
