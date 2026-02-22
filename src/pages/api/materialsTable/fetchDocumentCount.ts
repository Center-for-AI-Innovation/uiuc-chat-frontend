import { db } from '~/db/dbClient'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { and, eq, sql } from 'drizzle-orm'
import { documents } from '~/db/schema'
import { type PgColumn } from 'drizzle-orm/pg-core'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

type FetchDocumentCountResponse = {
  total_count?: number
  error?: string
}

/**
 * API handler to fetch the total count of documents for a course.
 * Optionally supports filtering by a search key/value pair.
 *
 * @param {AuthenticatedRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response with the document count.
 */
async function fetchDocumentCount(
  req: AuthenticatedRequest,
  res: NextApiResponse<FetchDocumentCountResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name } = req.query

  if (!course_name || typeof course_name !== 'string') {
    return res
      .status(400)
      .json({ error: 'Missing required query parameter: course_name' })
  }

  try {
    // Check if at least one document exists for this course_name
    const existsQuery = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.course_name, course_name))
      .limit(1)

    const total_count = existsQuery.length > 0 ? 1 : 0

    return res.status(200).json({ total_count })
  } catch (error) {
    console.error('Failed to fetch document count:', error)
    return res.status(500).json({ error: (error as any).message })
  }
}

export default withCourseAccessFromRequest('any')(fetchDocumentCount)
