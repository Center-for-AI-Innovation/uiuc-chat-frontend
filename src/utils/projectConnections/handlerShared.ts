// Shared helpers for the project-connections API handlers. Kept outside
// pages/api/ so Next.js doesn't try to route to it.

import type { NextApiRequest } from 'next'
import type { ZodError } from 'zod'
import { connectionManager } from '~/utils/connectionManager'

export interface RequestMeta {
  source_ip: string | null
  user_agent: string | null
  request_id: string | null
}

export function extractRequestMeta(req: NextApiRequest): RequestMeta {
  const fwd = req.headers['x-forwarded-for']
  const sourceIp = Array.isArray(fwd)
    ? (fwd[0] ?? null)
    : typeof fwd === 'string'
      ? (fwd.split(',')[0]?.trim() ?? null)
      : (req.socket?.remoteAddress ?? null)
  const ua = req.headers['user-agent']
  const userAgent = Array.isArray(ua) ? (ua[0] ?? null) : (ua ?? null)
  const rid =
    req.headers['x-request-id'] ?? req.headers['x-correlation-id'] ?? null
  const requestId = Array.isArray(rid) ? (rid[0] ?? null) : rid
  return { source_ip: sourceIp, user_agent: userAgent, request_id: requestId }
}

export function formatZodError(err: ZodError): {
  message: string
  issues: { path: string; message: string }[]
} {
  return {
    message: 'Validation failed',
    issues: err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    })),
  }
}

export async function invalidateForProject(projectName: string): Promise<void> {
  try {
    await connectionManager.invalidate(projectName)
  } catch (e) {
    console.warn(
      `[projectConnections] cache invalidation failed for ${projectName}:`,
      e,
    )
  }
}
