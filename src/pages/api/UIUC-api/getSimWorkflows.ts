import { type NextApiRequest, type NextApiResponse } from 'next'
import {
  type SimWorkflow,
  type SimWorkflowListItem,
  type SimInputField,
} from '~/types/sim'
import { resolveSimCredentials } from '~/utils/simConfig'

const SIM_DEFAULT_BASE_URL = 'https://www.sim.ai'

/**
 * GET /api/UIUC-api/getSimWorkflows?course_name=X[&api_key=...&workspace_id=...]
 *
 * Discovers deployed workflows from SimAI.
 * - NEXT_PUBLIC_SIM_STORAGE=local  → credentials from query params (localStorage)
 * - NEXT_PUBLIC_SIM_STORAGE=supabase → credentials from DB
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name, api_key, workspace_id, base_url } = req.query as {
    course_name?: string
    api_key?: string
    workspace_id?: string
    base_url?: string
  }

  const creds = await resolveSimCredentials(course_name, {
    api_key,
    workspace_id,
    base_url,
  })

  if (!creds.api_key || !creds.workspace_id) {
    return res.status(200).json({ workflows: [] })
  }

  const simBaseUrl = (creds.base_url ?? SIM_DEFAULT_BASE_URL).replace(/\/$/, '')
  const headers = { 'X-API-Key': creds.api_key }

  try {
    const listUrl = `${simBaseUrl}/api/v1/workflows?workspaceId=${encodeURIComponent(creds.workspace_id)}&deployedOnly=true`
    const listRes = await fetch(listUrl, { headers })

    if (!listRes.ok) {
      console.error('[getSimWorkflows] list failed', { status: listRes.status })
      return res
        .status(listRes.status)
        .json({ error: `Sim API returned ${listRes.status}` })
    }

    const listData = (await listRes.json()) as { data: SimWorkflowListItem[] }
    const items = listData.data ?? []

    if (items.length === 0) {
      return res.status(200).json({ workflows: [] })
    }

    const workflows: SimWorkflow[] = await Promise.all(
      items.map(async (item): Promise<SimWorkflow> => {
        try {
          const detailRes = await fetch(
            `${simBaseUrl}/api/v1/workflows/${item.id}`,
            { headers },
          )
          if (detailRes.ok) {
            const detail = (await detailRes.json()) as Record<string, unknown>
            return {
              id: item.id,
              name: item.name,
              description: item.description ?? '',
              inputFields: extractInputFields(detail),
            }
          }
        } catch (err) {
          console.debug(
            '[getSimWorkflows] detail fetch failed for',
            item.id,
            err,
          )
        }
        return {
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          inputFields: [],
        }
      }),
    )

    console.debug('[getSimWorkflows]', workflows.length, 'workflows discovered')
    return res.status(200).json({ workflows })
  } catch (error: unknown) {
    console.error('[getSimWorkflows] error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return res.status(500).json({ error: 'Failed to fetch Sim workflows' })
  }
}

/**
 * Extract input fields from the workflow detail response.
 * Sim API returns: { data: { inputs: [{ name, type, description }] } }
 */
function extractInputFields(detail: Record<string, unknown>): SimInputField[] {
  // Unwrap the `data` envelope if present
  const inner = (detail.data ?? detail) as Record<string, unknown>

  // `inputs` is a direct array of { name, type, description }
  const inputs = inner.inputs
  if (Array.isArray(inputs)) {
    return inputs.map((f: Record<string, unknown>) => ({
      name: String(f.name ?? ''),
      type: String(f.type ?? 'string'),
      description: f.description ? String(f.description) : undefined,
      required: Boolean(f.required ?? false),
    }))
  }

  return []
}
