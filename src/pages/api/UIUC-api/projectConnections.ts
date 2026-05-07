import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'
import { connectionManager } from '~/utils/connectionManager'

// Proxy to the Flask backend's /api/project-connections CRUD. The frontend's
// own ConnectionManager caches resolved configs/clients; whenever a mutation
// succeeds upstream we drop those caches so the next request reads fresh.
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const backendUrl = getBackendUrl()

  try {
    switch (req.method) {
      case 'GET': {
        const projectName =
          (req.query.project_name as string) ||
          (req.query.course_name as string)
        if (!projectName) {
          return res
            .status(400)
            .json({ error: 'project_name query parameter is required' })
        }

        const response = await fetch(
          `${backendUrl}/api/project-connections?project_name=${encodeURIComponent(projectName)}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        )
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      case 'POST': {
        const response = await fetch(`${backendUrl}/api/project-connections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        })
        const data = await response.json()
        if (response.ok) {
          await invalidateForProject(
            (req.body && (req.body.project_name || req.body.course_name)) ||
              data?.project_name,
          )
        }
        return res.status(response.status).json(data)
      }

      case 'DELETE': {
        const projectName =
          (req.query.project_name as string) ||
          (req.query.course_name as string)
        if (!projectName) {
          return res
            .status(400)
            .json({ error: 'project_name query parameter is required' })
        }

        let deleteUrl = `${backendUrl}/api/project-connections?project_name=${encodeURIComponent(projectName)}`
        const type = req.query.type as string
        if (type) {
          deleteUrl += `&type=${encodeURIComponent(type)}`
        }

        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (response.ok) {
          await invalidateForProject(projectName)
        }
        return res.status(response.status).json(data)
      }

      case 'PATCH': {
        const response = await fetch(
          `${backendUrl}/api/project-connections/active`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          },
        )
        const data = await response.json()
        if (response.ok) {
          await invalidateForProject(
            (req.body && (req.body.project_name || req.body.course_name)) ||
              data?.project_name,
          )
        }
        return res.status(response.status).json(data)
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in projectConnections proxy:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error while proxying request' })
  }
}

async function invalidateForProject(projectName: unknown): Promise<void> {
  if (typeof projectName !== 'string' || !projectName) return
  try {
    await connectionManager.invalidate(projectName)
  } catch (e) {
    // Don't fail the proxy response if cache invalidation hiccups; the
    // backend already invalidated its own cache, and ours will lapse on TTL.
    console.warn(
      `[projectConnections] cache invalidation failed for ${projectName}:`,
      e,
    )
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
