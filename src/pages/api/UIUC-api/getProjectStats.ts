import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
// src/pages/api/UIUC-api/getProjectStats.ts
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

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

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch data: ${response.statusText}`,
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching project stats:', error)
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
