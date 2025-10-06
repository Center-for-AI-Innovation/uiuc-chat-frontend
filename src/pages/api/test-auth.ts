import { NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // This endpoint will only be accessible with a valid JWT token
  return res.status(200).json({
    message: 'Authentication successful!',
    user: {
      sub: req.user?.sub,
      email: req.user?.email,
      preferred_username: req.user?.preferred_username,
    },
    timestamp: new Date().toISOString(),
  })
}

export default withAuth(handler)
