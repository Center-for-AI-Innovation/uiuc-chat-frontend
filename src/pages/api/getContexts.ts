import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import fetchContextsFromBackend from '~/utils/fetchContexts'
import { fetchContextsViaDrizzleVectorSearch } from '~/server/fetchContextsForVectorSearch'
import { connectionManager } from '~/utils/connectionManager'


export default withCourseAccessFromRequest('any')(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // TODO: Does this need to take req.user?.email into account to filter results?

  try {
    const {
      course_name,
      search_query,
      token_limit = 4000,
      doc_groups = [],
      conversation_id,
      top_n = 100,
    } = req.body

    if (!course_name || !search_query) {
      return res.status(400).json({
        error: 'course_name and search_query are required',
      })
    }

    // Dispatch by engine resolved per-project. Qdrant-backed projects need
    // to hit the Python backend (which owns the Qdrant client + multi-
    // collection fan-out). Pgvector projects can run the search locally
    // via Drizzle on whatever documents DB the project is bound to. If
    // resolution fails (e.g. host DB unreachable) we fall back to the
    // local Drizzle path with a warning rather than 500-ing the request.
    let engineKind: 'qdrant' | 'pgvector' = 'pgvector'
    try {
      engineKind = (await connectionManager.resolveVectorEngine(course_name)).kind
    } catch (err) {
      console.warn(
        `[getContexts] resolveVectorEngine failed for ${course_name}; defaulting to pgvector:`,
        err,
      )
    }

    const data =
      engineKind === 'qdrant'
        ? await fetchContextsFromBackend(
            course_name,
            search_query,
            token_limit,
            doc_groups,
            conversation_id,
            top_n,
          )
        : await fetchContextsViaDrizzleVectorSearch(
            course_name,
            search_query,
            doc_groups,
            conversation_id,
            top_n,
          )

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return res.status(500).json({
      error: 'Internal server error while fetching contexts',
      data: [],
    })
  }
}
