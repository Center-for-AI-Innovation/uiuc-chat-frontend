// POST /api/UIUC-api/projectConnections/test
// Probes an external connection without persisting anything. Server-side
// SSRF protections live in ~/utils/projectConnections/tester.

import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '~/utils/authMiddleware'
import { withSuperAdminOnly } from '~/utils/superAdminGuard'
import { writeAuditEntry } from '~/db/projectConnectionsRepo'
import { testBodySchema } from '~/utils/projectConnections/validation'
import {
  testS3,
  testDatabase,
  testQdrant,
  testEmbedding,
  type TestResult,
} from '~/utils/projectConnections/tester'
import {
  extractRequestMeta,
  formatZodError,
} from '~/utils/projectConnections/handlerShared'
import type { TestBody } from '~/utils/projectConnections/validation'

// Build a host-only, secrets-free one-line summary of the probe target for
// stdout logging. Anything that could leak credentials (api_key,
// aws_secret_access_key, query string, userinfo on a postgres URI, full
// connection_uri) is dropped — only scheme + host + port + kind-specific
// non-secret fields are emitted.
function summarizeForLog(body: TestBody): string {
  try {
    if (body.kind === 's3') {
      const { endpoint_url, bucket_name, region } = body.config
      const parts: string[] = []
      if (endpoint_url) {
        const u = new URL(endpoint_url)
        parts.push(`endpoint=${u.protocol}//${u.host}`)
      } else {
        parts.push('endpoint=aws')
      }
      if (region) parts.push(`region=${region}`)
      if (bucket_name) parts.push(`bucket=${bucket_name}`)
      return parts.join(' ')
    }
    if (body.kind === 'database') {
      const u = new URL(body.config.connection_uri)
      return `host=${u.hostname} port=${u.port || '(default)'} db=${u.pathname.replace(/^\//, '') || '(default)'}`
    }
    if (body.kind === 'qdrant') {
      const { url, port } = body.config
      const u = new URL(url)
      return `url_host=${u.host} url_scheme=${u.protocol.replace(':', '')} port=${port}`
    }
    // embedding
    const c = body.config
    if (c.provider === 'ollama') {
      const u = new URL(c.base_url!)
      return `provider=ollama base=${u.protocol}//${u.host} model=${c.model}`
    }
    const apiBase = c.api_base || '(default)'
    const apiHost = (() => {
      try {
        const u = new URL(apiBase)
        return `${u.protocol}//${u.host}`
      } catch {
        return apiBase
      }
    })()
    return `provider=${c.provider} api_base=${apiHost} model=${c.model}`
  } catch {
    return '(unparseable target)'
  }
}

// Exported for unit tests — see projectConnections.ts for the same pattern.
export async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = testBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) })
  }
  const body = parsed.data
  const meta = extractRequestMeta(req)
  const actorEmail = req.user?.email ?? 'unknown'

  // Log the probe attempt with a host-only summary — never the api_key,
  // aws_secret_access_key, or full connection_uri. Mirrors the DB audit row
  // written below but goes to stdout for live debugging.
  const summary = summarizeForLog(body)
  console.log(
    `[projectConnections/test] probe kind=${body.kind} actor=${actorEmail} ${summary}`,
  )

  let result: TestResult
  try {
    if (body.kind === 's3') result = await testS3(body.config)
    else if (body.kind === 'database') result = await testDatabase(body.config)
    else if (body.kind === 'qdrant') result = await testQdrant(body.config)
    else result = await testEmbedding(body.config)
  } catch (e) {
    result = {
      ok: false,
      code: 'unknown',
      message: 'Probe threw unexpectedly',
    }
    console.error('[projectConnections/test] threw:', e)
  }

  if (result.ok) {
    console.log(`[projectConnections/test] ok kind=${body.kind}`)
  } else {
    console.warn(
      `[projectConnections/test] fail kind=${body.kind} code=${result.code} message=${result.message}`,
    )
  }

  // Audit the test attempt. The connection_uri / api_key / etc. are NOT
  // included — only the kind and outcome. project_name is null because the
  // probe happens before a config is associated with a specific project.
  await writeAuditEntry({
    actor_email: actorEmail,
    action: 'test',
    project_name: null,
    kind: body.kind,
    outcome: result.ok ? 'success' : 'failure',
    failure_reason: result.ok ? null : (result.code ?? 'unknown'),
    changed_fields: null,
    ...meta,
  })

  return res.status(200).json(result)
}

export default withSuperAdminOnly(handler)
