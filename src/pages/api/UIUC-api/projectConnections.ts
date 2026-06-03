// Full CRUD for project_external_connections. The frontend is the sole
// writer; the backend's ConnectionManager reads the same rows for runtime
// dispatch. Authorization is super-admin-only via withSuperAdminOnly (the
// guard runs inside the handler — not Next middleware, see CVE-2025-29927).

import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '~/utils/authMiddleware'
import { withSuperAdminOnly } from '~/utils/superAdminGuard'
import {
  decryptProjectConfig,
  encryptProjectConfig,
  maskConfig,
  type EncryptedField,
} from '~/utils/crypto'
import {
  getProjectIdByName,
  getConnectionByProject,
  upsertConnectionField,
  deleteConnection,
  writeAuditEntry,
} from '~/db/projectConnectionsRepo'
import {
  upsertBodySchema,
  deleteQuerySchema,
  getQuerySchema,
  CONNECTION_KINDS,
  type ConnectionKind,
} from '~/utils/projectConnections/validation'
import {
  extractRequestMeta,
  formatZodError,
  invalidateForProject,
} from '~/utils/projectConnections/handlerShared'

// Exported for unit tests — the route default export wraps this in
// withSuperAdminOnly. Tests can invoke `handler` directly with a pre-set
// req.user to bypass the JWT/role layer.
export async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const meta = extractRequestMeta(req)
  const actorEmail = req.user?.email ?? 'unknown'

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res, actorEmail, meta)
      case 'DELETE':
        return await handleDelete(req, res, actorEmail, meta)
      default:
        res.setHeader('Allow', 'GET, POST, DELETE')
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('[projectConnections] handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ---------------------------------------------------------------------------
// GET — return decrypted + masked configs
// ---------------------------------------------------------------------------

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const parsed = getQuerySchema.safeParse({
    project_name:
      (req.query.project_name as string | undefined) ??
      (req.query.course_name as string | undefined),
  })
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) })
  }
  const { project_name } = parsed.data

  const row = await getConnectionByProject(project_name)
  if (!row) {
    return res.status(200).json({ found: false, project_name })
  }

  const [s3, database, qdrant, embedding] = await Promise.all([
    decryptProjectConfig<Record<string, unknown>>(row.s3_config as EncryptedField),
    decryptProjectConfig<Record<string, unknown>>(row.database_config as EncryptedField),
    decryptProjectConfig<Record<string, unknown>>(row.qdrant_config as EncryptedField),
    decryptProjectConfig<Record<string, unknown>>(row.embedding_config as EncryptedField),
  ])

  return res.status(200).json({
    found: true,
    project_name: row.project_name,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    s3_config: maskConfig(s3),
    database_config: maskConfig(database),
    qdrant_config: maskConfig(qdrant),
    embedding_config: maskConfig(embedding),
  })
}

// ---------------------------------------------------------------------------
// POST — upsert one connection kind
// ---------------------------------------------------------------------------

async function handlePost(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  actorEmail: string,
  meta: ReturnType<typeof extractRequestMeta>,
) {
  const parsed = upsertBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) })
  }
  const body = parsed.data
  const projectName = body.project_name
  const kind: ConnectionKind = body.kind

  const projectId = await getProjectIdByName(projectName)
  if (projectId == null) {
    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'upsert',
      project_name: projectName,
      kind,
      outcome: 'failure',
      failure_reason: 'project_not_found',
      changed_fields: null,
      ...meta,
    })
    return res.status(404).json({
      error: `Project '${projectName}' not found. Create it first.`,
    })
  }

  try {
    const encryptedBlob = await encryptProjectConfig(body.config)
    await upsertConnectionField({
      projectName,
      projectId,
      kind,
      encryptedBlob,
    })
    await invalidateForProject(projectName)

    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'upsert',
      project_name: projectName,
      kind,
      outcome: 'success',
      failure_reason: null,
      // Field NAMES only — never the values.
      changed_fields: Object.keys(body.config as Record<string, unknown>),
      ...meta,
    })

    return res.status(200).json({
      success: true,
      project_name: projectName,
      project_id: projectId,
      kind,
    })
  } catch (e) {
    console.error('[projectConnections] upsert failed:', e)
    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'upsert',
      project_name: projectName,
      kind,
      outcome: 'failure',
      failure_reason: e instanceof Error ? e.message.slice(0, 200) : 'unknown',
      changed_fields: null,
      ...meta,
    })
    return res.status(500).json({ error: 'Failed to upsert connection' })
  }
}

// ---------------------------------------------------------------------------
// DELETE — drop a row or NULL one column
// ---------------------------------------------------------------------------

async function handleDelete(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  actorEmail: string,
  meta: ReturnType<typeof extractRequestMeta>,
) {
  const rawKind = req.query.kind ?? req.query.type
  const parsed = deleteQuerySchema.safeParse({
    project_name:
      (req.query.project_name as string | undefined) ??
      (req.query.course_name as string | undefined),
    kind: typeof rawKind === 'string' ? rawKind : undefined,
  })
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) })
  }
  if (
    parsed.data.kind !== undefined &&
    !CONNECTION_KINDS.includes(parsed.data.kind)
  ) {
    return res.status(400).json({
      error: `kind must be one of: ${CONNECTION_KINDS.join(', ')}`,
    })
  }
  const { project_name, kind } = parsed.data

  try {
    const result = await deleteConnection({ projectName: project_name, kind })
    await invalidateForProject(project_name)

    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'delete',
      project_name,
      kind: kind ?? null,
      outcome: 'success',
      failure_reason: null,
      changed_fields: null,
      ...meta,
    })

    return res.status(200).json({
      success: true,
      project_name,
      deleted: result.deleted,
      found: result.found,
      cleared: result.cleared,
    })
  } catch (e) {
    console.error('[projectConnections] delete failed:', e)
    await writeAuditEntry({
      actor_email: actorEmail,
      action: 'delete',
      project_name,
      kind: kind ?? null,
      outcome: 'failure',
      failure_reason: e instanceof Error ? e.message.slice(0, 200) : 'unknown',
      changed_fields: null,
      ...meta,
    })
    return res.status(500).json({ error: 'Failed to delete connection' })
  }
}

export default withSuperAdminOnly(handler)
