import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
// src/pages/api/UIUC-api/getProjectStats.ts
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'
import { db } from '~/db/dbClient'
import { projectStats } from '~/db/schema'
import { eq } from 'drizzle-orm'

interface RawStats {
  total_conversations?: number
  total_messages?: number
  unique_users?: number
  avg_conversations_per_user?: number
  avg_messages_per_user?: number
  avg_messages_per_conversation?: number
}

// The analytics backend returns only raw counts; derive the averages here so
// every consumer (dashboard + analysis page) receives a complete, consistent
// stats object. Prefer pre-supplied averages when present.
function withAverages(data: RawStats) {
  const total_conversations = data.total_conversations || 0
  const total_messages = data.total_messages || 0
  const unique_users = data.unique_users || 0

  return {
    total_conversations,
    total_messages,
    unique_users,
    avg_conversations_per_user:
      data.avg_conversations_per_user ??
      (unique_users ? +(total_conversations / unique_users).toFixed(1) : 0),
    avg_messages_per_user:
      data.avg_messages_per_user ??
      (unique_users ? +(total_messages / unique_users).toFixed(1) : 0),
    avg_messages_per_conversation:
      data.avg_messages_per_conversation ??
      (total_conversations
        ? +(total_messages / total_conversations).toFixed(1)
        : 0),
  }
}

// Fallback: read the precomputed project_stats row from our own database when
// the analytics backend is unavailable. Returns null if there is no row.
async function getLocalProjectStats(
  projectName: string,
): Promise<RawStats | null> {
  const rows = await db
    .select()
    .from(projectStats)
    .where(eq(projectStats.project_name, projectName))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    total_conversations: row.total_conversations ?? 0,
    total_messages: row.total_messages ?? 0,
    unique_users: row.unique_users ?? 0,
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { project_name } = req.body

  if (!project_name) {
    return res
      .status(400)
      .json({ error: 'Missing required project_name parameter' })
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/getProjectStats?project_name=${project_name}`,
    )

    if (response.ok) {
      const data = (await response.json()) as RawStats
      return res.status(200).json(withAverages(data))
    }

    console.warn(
      `Analytics backend returned ${response.status} for getProjectStats; falling back to local project_stats.`,
    )
  } catch (error) {
    console.warn(
      'Analytics backend unreachable for getProjectStats; falling back to local project_stats:',
      (error as Error).message,
    )
  }

  // Backend failed — serve the precomputed row from our own database.
  try {
    const local = await getLocalProjectStats(project_name)
    if (local) {
      return res.status(200).json(withAverages(local))
    }
    return res.status(200).json(withAverages({}))
  } catch (error) {
    console.error('Error reading local project stats:', error)
    return res.status(500).json({
      error: 'Failed to fetch project stats',
      details: (error as Error).message,
    })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)

export async function getProjectStats(project_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getProjectStats?project_name=${project_name}`,
    )

    if (!response.ok) {
      return {
        status: response.status,
        data: {
          total_conversations: 0,
          total_messages: 0,
          unique_users: 0,
          avg_conversations_per_user: 0,
          avg_messages_per_user: 0,
          avg_messages_per_conversation: 0,
        },
      }
    }

    const data = await response.json()
    const total_conversations = data.total_conversations || 0
    const total_messages = data.total_messages || 0
    const unique_users = data.unique_users || 0

    return {
      status: 200,
      data: {
        total_conversations,
        total_messages,
        unique_users,
        avg_conversations_per_user: unique_users
          ? +(total_conversations / unique_users).toFixed(1)
          : 0,
        avg_messages_per_user: unique_users
          ? +(total_messages / unique_users).toFixed(1)
          : 0,
        avg_messages_per_conversation: total_conversations
          ? +(total_messages / total_conversations).toFixed(1)
          : 0,
      },
    }
  } catch (error) {
    console.error('Error in getProjectStats:', error)
    return {
      status: 500,
      data: {
        total_conversations: 0,
        total_messages: 0,
        unique_users: 0,
        avg_conversations_per_user: 0,
        avg_messages_per_user: 0,
        avg_messages_per_conversation: 0,
      },
    }
  }
}
