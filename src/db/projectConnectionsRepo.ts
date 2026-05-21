// Drizzle-backed CRUD for project_external_connections. The frontend is the
// sole writer; the backend reads via SQLAlchemy ORM. All operations run
// against `hostDb` — this table never participates in per-project routing.

import { eq, sql } from 'drizzle-orm'
import { db as hostDb } from '~/db/dbClient'
import {
  projectExternalConnections,
  projectConnectionAuditLog,
  projects,
  type ProjectExternalConnections,
  type NewProjectConnectionAuditLog,
} from '~/db/schema'
import type { ConnectionKind } from '~/utils/projectConnections/validation'

// Look up a project's primary-key id by its `course_name`. Returns null if
// the project does not exist — the route handler turns that into a 404.
export async function getProjectIdByName(
  projectName: string,
): Promise<number | null> {
  const rows = await hostDb
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.course_name, projectName))
    .limit(1)
  return rows[0]?.id ?? null
}

const KIND_TO_COLUMN: Record<
  ConnectionKind,
  's3_config' | 'database_config' | 'qdrant_config' | 'embedding_config'
> = {
  s3: 's3_config',
  database: 'database_config',
  qdrant: 'qdrant_config',
  embedding: 'embedding_config',
}

export async function getConnectionByProject(
  projectName: string,
): Promise<ProjectExternalConnections | null> {
  const rows = await hostDb
    .select()
    .from(projectExternalConnections)
    .where(eq(projectExternalConnections.project_name, projectName))
    .limit(1)
  return rows[0] ?? null
}

export async function upsertConnectionField(args: {
  projectName: string
  projectId: number
  kind: ConnectionKind
  encryptedBlob: { encrypted: string }
}): Promise<ProjectExternalConnections> {
  const { projectName, projectId, kind, encryptedBlob } = args
  const column = KIND_TO_COLUMN[kind]

  // Build the field-set we want for both INSERT and the UPDATE branch.
  const fieldUpdate: Record<string, unknown> = {
    [column]: encryptedBlob,
    is_active: true,
    updated_at: new Date(),
  }
  const insertValues = {
    project_id: projectId,
    project_name: projectName,
    s3_config: kind === 's3' ? encryptedBlob : null,
    database_config: kind === 'database' ? encryptedBlob : null,
    qdrant_config: kind === 'qdrant' ? encryptedBlob : null,
    embedding_config: kind === 'embedding' ? encryptedBlob : null,
    is_active: true,
  }

  const [row] = await hostDb
    .insert(projectExternalConnections)
    .values(insertValues)
    .onConflictDoUpdate({
      target: projectExternalConnections.project_name,
      set: fieldUpdate,
    })
    .returning()

  if (!row) {
    throw new Error('upsertConnectionField: no row returned from insert/update')
  }
  return row
}

export async function deleteConnection(args: {
  projectName: string
  kind?: ConnectionKind
}): Promise<{ deleted: boolean; found: boolean; cleared: ConnectionKind | null }> {
  const { projectName, kind } = args

  if (!kind) {
    const result = await hostDb
      .delete(projectExternalConnections)
      .where(eq(projectExternalConnections.project_name, projectName))
      .returning({ id: projectExternalConnections.id })
    const deleted = result.length > 0
    return { deleted, found: deleted, cleared: null }
  }

  const existing = await getConnectionByProject(projectName)
  if (!existing) return { deleted: false, found: false, cleared: null }

  const column = KIND_TO_COLUMN[kind]
  await hostDb
    .update(projectExternalConnections)
    .set({ [column]: null, updated_at: new Date() })
    .where(eq(projectExternalConnections.project_name, projectName))

  return { deleted: true, found: true, cleared: kind }
}

export async function setActive(args: {
  projectName: string
  isActive: boolean
}): Promise<{ found: boolean; is_active: boolean | null }> {
  const { projectName, isActive } = args
  const result = await hostDb
    .update(projectExternalConnections)
    .set({ is_active: isActive, updated_at: new Date() })
    .where(eq(projectExternalConnections.project_name, projectName))
    .returning({ is_active: projectExternalConnections.is_active })
  const row = result[0]
  if (!row) return { found: false, is_active: null }
  return { found: true, is_active: row.is_active }
}

export async function writeAuditEntry(
  entry: Omit<NewProjectConnectionAuditLog, 'id' | 'occurred_at'>,
): Promise<void> {
  try {
    await hostDb.insert(projectConnectionAuditLog).values(entry)
  } catch (e) {
    // Audit failures should never break the user-visible response, but they
    // are important to surface. Log and move on.
    console.error('[projectConnections] audit-log write failed:', e, {
      action: entry.action,
      project_name: entry.project_name,
    })
  }
}

// Re-export sql for callers that need raw fragments (kept here so they don't
// have to depend on drizzle-orm directly).
export { sql }
