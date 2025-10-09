import { db, documentsFailed } from '~/db/dbClient'
import { eq, sql, and, gte, InferSelectModel } from 'drizzle-orm'
import type { NextApiResponse, NextApiRequest } from 'next'
import { AuthenticatedRequest } from '~/utils/authMiddleware'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

// export const runtime = 'edge'

type FetchFailedDocumentsResponse =
  | {
      final_docs: InferSelectModel<typeof documentsFailed>[] | null
      total_count: number
      recent_fail_count: number
    }
  | { error: string }

async function fetchFailedDocuments(
  req: AuthenticatedRequest,
  res: NextApiResponse<FetchFailedDocumentsResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = new URL(req.url as string, `http://${req.headers.host}`)
  const fromStr = url.searchParams.get('from')
  const toStr = url.searchParams.get('to')
  const course_name = url.searchParams.get('course_name')
  const search_key = url.searchParams.get('filter_key') as string
  const search_value = url.searchParams.get('filter_value') as string
  let sort_column = url.searchParams.get('sort_column') as string
  let sort_direction = url.searchParams.get('sort_direction') === 'asc'
  if (fromStr === null || toStr === null) {
    throw new Error('Missing required query parameters: from and to')
  }
  if (sort_column == null || sort_direction == null) {
    sort_column = 'created_at'
    sort_direction = false // 'desc' equivalent
  }
  const from = parseInt(fromStr as string)
  const to = parseInt(toStr as string)
  try {
    let failedDocs
    let finalError

    let count
    let countError

    let recentFailCount
    let recentFailError

    if (search_key && search_value) {
      try {
        const data = await db
          .select({
            id: documentsFailed.id,
            course_name: documentsFailed.course_name,
            readable_filename: documentsFailed.readable_filename,
            s3_path: documentsFailed.s3_path,
            url: documentsFailed.url,
            base_url: documentsFailed.base_url,
            created_at: documentsFailed.created_at,
            error: documentsFailed.error,
          })
          .from(documentsFailed)
          .where(
            and(
              eq(documentsFailed.course_name, course_name as string),
              sql`${sql.identifier(search_key as string)}
              ILIKE
              ${`%${search_value}%`}`,
            ),
          )
          .orderBy(
            sql`${sql.identifier(sort_column as string)}
          ${sort_direction ? sql`ASC` : sql`DESC`}`,
          )
          .limit(to - from + 1)
          .offset(from)

        failedDocs = data as InferSelectModel<typeof documentsFailed>[]
        finalError = null
      } catch (err) {
        failedDocs = null
        finalError = err
      }
    } else {
      try {
        const data = await db
          .select()
          .from(documentsFailed)
          .where(eq(documentsFailed.course_name, course_name as string))
          .orderBy(
            sql`${sql.identifier(sort_column as string)}
          ${sort_direction ? sql`ASC` : sql`DESC`}`,
          )
          .limit(to - from + 1)
          .offset(from)

        failedDocs = data as InferSelectModel<typeof documentsFailed>[]
        finalError = null
      } catch (err) {
        failedDocs = null
        finalError = err
      }
    }

    if (finalError) {
      throw finalError
    }
    if (!failedDocs) {
      throw new Error('Failed to fetch failed documents')
    }

    if (search_key && search_value) {
      try {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(documentsFailed)
          .where(
            and(
              eq(documentsFailed.course_name, course_name as string),
              sql`${sql.identifier(search_key as string)}
              ILIKE
              ${`%${search_value}%`}`,
            ),
          )
        count = countResult[0]?.count ?? 0
        countError = null
      } catch (err) {
        count = 0
        countError = err
      }
    } else {
      // Fetch the total count of documents for the selected course
      try {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(documentsFailed)
          .where(eq(documentsFailed.course_name, course_name as string))

        count = countResult[0]?.count ?? 0
        countError = null
      } catch (err) {
        count = 0
        countError = err
      }
    }
    if (countError) {
      throw countError
    }

    // Fetch the count of failed documents from the last 24 hours
    const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    try {
      const recentFailCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(documentsFailed)
        .where(
          and(
            eq(documentsFailed.course_name, course_name as string),
            gte(documentsFailed.created_at, oneDayAgo),
          ),
        )
      recentFailCount = recentFailCountResult[0]?.count ?? 0
      recentFailError = null
    } catch (err) {
      recentFailCount = 0
      recentFailError = err
    }

    if (recentFailError) throw recentFailError

    return res.status(200).json({
      final_docs: failedDocs,
      total_count: count,
      recent_fail_count: recentFailCount,
    })
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message })
  }
}

export default withCourseOwnerOrAdminAccess()(fetchFailedDocuments)
