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
