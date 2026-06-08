// PATCH /api/UIUC-api/projectConnections/active
// Toggles the is_active flag on a project's external connection row.

import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '~/utils/authMiddleware'
import { withSuperAdminOnly } from '~/utils/superAdminGuard'
import { setActive } from '~/db/projectConnectionsRepo'
import { writeAuditEntry } from '~/db/projectConnectionsRepo'
import { setActiveBodySchema } from '~/utils/projectConnections/validation'
import {
  extractRequestMeta,
  formatZodError,
  invalidateForProject,
} from '~/utils/projectConnections/handlerShared'

// Exported for unit tests — see projectConnections.ts for the same pattern.
export async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = setActiveBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) })
  }
  const { project_name, is_active } = parsed.data
  const meta = extractRequestMeta(req)
  const actorEmail = req.user?.email ?? 'unknown'

  try {
    const result = await setActive({
      projectName: project_name,
      isActive: is_active,
    })
    if (!result.found) {
      await writeAuditEntry({
        actor_email: actorEmail,
        action: 'set_active',
        project_name,
        kind: null,
        outcome: 'failure',
        failure_reason: 'not_found',
        changed_fields: null,
        ...meta,
      })
      return res.status(404).json({
        error: `No external connection found for project '${project_name}'.`,
      })
    }

    await invalidateForProject(project_name)
    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'set_active',
      project_name,
      kind: null,
      outcome: 'success',
      failure_reason: null,
      changed_fields: ['is_active'],
      ...meta,
    })
    return res
      .status(200)
      .json({ success: true, project_name, is_active: result.is_active })
  } catch (e) {
    console.error('[projectConnections/active] failed:', e)
    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'set_active',
      project_name,
      kind: null,
      outcome: 'failure',
      failure_reason: e instanceof Error ? e.message.slice(0, 200) : 'unknown',
      changed_fields: null,
      ...meta,
    })
    return res.status(500).json({ error: 'Failed to update is_active' })
  }
}

export default withSuperAdminOnly(handler)
