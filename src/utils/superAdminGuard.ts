// In-handler super-admin guard. We do NOT rely on Next middleware for this
// check (see Next.js CVE-2025-29927) — the role check runs after token
// verification, inside the wrapper that composes withAuth.

import type { NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { isSuperAdmin } from '~/utils/superAdmins'

type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse,
) => Promise | void

export function withSuperAdminOnly(handler: ApiHandler): ApiHandler {
  return withAuth(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }
    if (!isSuperAdmin(req.user.email)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This action requires super-admin privileges.',
      })
    }
    return await handler(req, res)
  })
}
