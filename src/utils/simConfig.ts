import { db } from '~/db/dbClient'
import { sql } from 'drizzle-orm'

export interface SimCredentials {
  api_key: string | null
  workspace_id: string | null
  base_url: string | null
}

const useLocalStorage = process.env.NEXT_PUBLIC_SIM_STORAGE !== 'supabase'

/**
 * Resolve Sim credentials for a project.
 *
 * - NEXT_PUBLIC_SIM_STORAGE=local (default) → uses values from `fromRequest`
 * - NEXT_PUBLIC_SIM_STORAGE=supabase → reads from DB via raw SQL
 *   (avoids Drizzle schema dependency so columns can stay commented out)
 *
 * Params from `fromRequest` always take priority over DB values.
 */
export async function resolveSimCredentials(
  course_name?: string,
  fromRequest?: {
    api_key?: string
    workspace_id?: string
    base_url?: string
  },
): Promise<SimCredentials> {
  // Request params always win (explicit > implicit)
  if (fromRequest?.api_key) {
    return {
      api_key: fromRequest.api_key,
      workspace_id: fromRequest.workspace_id ?? null,
      base_url: fromRequest.base_url ?? null,
    }
  }

  // If supabase mode, try DB
  if (!useLocalStorage && course_name) {
    try {
      const rows = await db.execute<{
        sim_api_key: string | null
        sim_base_url: string | null
        sim_workspace_id: string | null
      }>(
        sql`SELECT sim_api_key, sim_base_url, sim_workspace_id
            FROM projects
            WHERE course_name = ${course_name}
            LIMIT 1`,
      )
      const row = rows[0]
      if (row?.sim_api_key) {
        return {
          api_key: row.sim_api_key,
          workspace_id: row.sim_workspace_id,
          base_url: row.sim_base_url,
        }
      }
    } catch (err) {
      console.error('[resolveSimCredentials] DB query failed', err)
    }
  }

  return { api_key: null, workspace_id: null, base_url: null }
}
