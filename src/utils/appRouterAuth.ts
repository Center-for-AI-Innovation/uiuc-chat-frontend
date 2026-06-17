import jwt from 'jsonwebtoken'
import { type AuthenticatedUser } from '~/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { getKeycloakBaseFromHost } from '~/utils/authHelpers'
import { verifyTokenAsync } from './keycloakClient'

function getTokenFromCookies(req: NextRequest): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  // Parse the cookie header into a decoded map. Split on the FIRST '=' only
  // (cookie values may contain '=') and decode each value so it matches the
  // semantics of Next's `req.cookies` used by the Pages gate.
  const cookies: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const name = trimmed.slice(0, eq)
    const rawValue = trimmed.slice(eq + 1)
    try {
      cookies[name] = decodeURIComponent(rawValue)
    } catch {
      cookies[name] = rawValue
    }
  }

  return cookies['access_token'] ?? null
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser
}

export function getUserIdentifier(req: AuthenticatedRequest): string | null {
  const userEmail = req.user?.email as string | undefined
  if (userEmail && userEmail.trim() !== '') {
    return userEmail
  }

  const headerEmail = req.headers.get('x-user-email')
  if (headerEmail && headerEmail.trim() !== '') {
    return headerEmail
  }

  const posthogId = req.headers.get('x-posthog-id')
  if (posthogId && posthogId.trim() !== '') {
    return posthogId
  }

  return null
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
