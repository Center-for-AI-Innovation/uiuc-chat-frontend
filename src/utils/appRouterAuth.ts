import jwt from 'jsonwebtoken'
import { type NextRequest, NextResponse } from 'next/server'
import { getKeycloakBaseFromHost } from '~/utils/authHelpers'
import { type AuthenticatedUser } from './authMiddleware'
import { verifyTokenAsync } from './keycloakClient'

function getTokenFromCookies(req: NextRequest): string | null {
  // Find oidc.user* cookie
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [name, ...rest] = cookie.trim().split('=')
      if (!name) return acc
      acc[name] = rest.join('=')
      return acc
    },
    {} as Record<string, string>,
  )

  const raw = cookies['access_token']
  if (!raw) return null
  return raw
}

// Do we need this? It's not used anywhere.
function peekIssuer(token: string): string {
  const [, p] = token.split('.')
  if (!p) return ''
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'))
  return String(payload.iss || '').replace(/\/$/, '')
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser
}

// Authentication wrapper for App Router API routes
export function withAppRouterAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const token = getTokenFromCookies(req)

      if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 401 })
      }

      const rawHost =
        req.headers.get('x-forwarded-host') ?? req.headers.get('host')
      const hostValue = Array.isArray(rawHost) ? rawHost[0] : rawHost

      // Fallback to 'localhost' if undefined
      const hostname = (hostValue ?? 'localhost').split(':')[0]
      const keycloakBaseUrl = getKeycloakBaseFromHost(hostname)

      // Verify JWT token using Keycloak's JWKS endpoint
      const decoded = (await verifyTokenAsync(
        token,
        keycloakBaseUrl,
      )) as AuthenticatedUser

      // Add user to request object
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = decoded

      // Call the original handler
      return await handler(authenticatedReq)
    } catch (error) {
      console.error('JWT verification error:', error)

      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          {
            error: 'Token expired',
            message: 'Your session has expired. Please log in again.',
          },
          { status: 401 },
        )
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          {
            error: 'Invalid token',
            message: 'The provided token is invalid',
          },
          { status: 401 },
        )
      }

      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Unable to verify your identity',
        },
        { status: 401 },
      )
    }
  }
}
