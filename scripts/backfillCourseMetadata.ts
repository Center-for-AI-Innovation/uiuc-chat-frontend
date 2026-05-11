/**
 * One-off backfill: copy every entry in the Redis `course_metadatas` hash
 * into the Postgres `course_metadata` table via the atomic dual-write helper.
 *
 * Idempotent: safe to re-run. Uses the same helper production mutations use,
 * so it exercises the rollback path if Redis is flaky.
 *
 * Run: `npx tsx scripts/backfillCourseMetadata.ts [--dry-run]`
 */
import 'dotenv/config'
import { ensureRedisConnected } from '../src/utils/redisClient'
import { writeCourseMetadata } from '../src/utils/courseMetadataStore'
import type { CourseMetadata } from '../src/types/courseMetadata'

const REDIS_HASH = 'course_metadatas'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log(
    `Starting course_metadata backfill${dryRun ? ' (DRY RUN — no writes)' : ''}`,
  )

  const redis = await ensureRedisConnected()
  const allRaw = await redis.hGetAll(REDIS_HASH)

  const entries = Object.entries(allRaw ?? {})
  console.log(`Found ${entries.length} entries in Redis hash "${REDIS_HASH}"`)

  let succeeded = 0
  let failed = 0
  const failures: { courseName: string; error: string }[] = []

  for (const [courseName, rawValue] of entries) {
    let metadata: CourseMetadata
    try {
      metadata = JSON.parse(rawValue) as CourseMetadata
    } catch (parseErr) {
      failed += 1
      failures.push({
        courseName,
        error: `JSON parse failed: ${String(parseErr)}`,
      })
      continue
    }

    if (dryRun) {
      succeeded += 1
      continue
    }

    try {
      await writeCourseMetadata(courseName, metadata)
      succeeded += 1
      if (succeeded % 25 === 0) {
        console.log(`  ...${succeeded}/${entries.length} done`)
      }
    } catch (err) {
      failed += 1
      failures.push({
        courseName,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  console.log(
    `\nBackfill complete. Succeeded: ${succeeded}, Failed: ${failed}, Total: ${entries.length}`,
  )
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) {
      console.log(`  - ${f.courseName}: ${f.error}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Backfill crashed:', err)
  process.exit(1)
})
