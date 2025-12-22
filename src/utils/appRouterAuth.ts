import jwt from 'jsonwebtoken'
import { type AuthenticatedUser } from '~/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { getKeycloakBaseFromHost, getKeycloakIssuerUrl } from '~/utils/authHelpers'
import { verifyTokenAsync } from './keycloakClient'

function getTokenFromCookies(req: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Fall back to cookie
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split('=')
      if (name) acc[name] = value ?? ''
      return acc
    },
    {} as Record<string, string>,
  )

  const raw = cookies['access_token']
  if (!raw) return null
  return raw
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
        console.error('❌ Authentication failed: No token found in Authorization header or cookies')
        return NextResponse.json({ error: 'Missing token' }, { status: 401 })
      }

      console.log('🔐 Token found, length:', token.length, 'starts with:', token.substring(0, 20) + '...')

      const rawHost =
        req.headers.get('x-forwarded-host') ?? req.headers.get('host')
      const hostValue = Array.isArray(rawHost) ? rawHost[0] : rawHost

      console.log('🔐 Host value:', hostValue)

      // Fallback to 'localhost' if undefined
      const hostname = (hostValue ?? 'localhost').split(':')[0]
      const keycloakBaseUrl = getKeycloakBaseFromHost(hostname)
      const issuerUrl = getKeycloakIssuerUrl(hostname)

      console.log('🔐 Verifying token with Keycloak:', { keycloakBaseUrl, issuerUrl })

      // Verify JWT token using Keycloak's JWKS endpoint
      const decoded = (await verifyTokenAsync(
        token,
        keycloakBaseUrl,
        issuerUrl,
      )) as AuthenticatedUser

      console.log('🔐 Token verified successfully for user:', decoded.email)

      // Add user to request object
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = decoded

      // Call the original handler
      return await handler(authenticatedReq)
    } catch (error) {
      console.error('❌ JWT verification error:', error)
      console.error('❌ Error type:', error?.constructor?.name)
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error))

      if (error instanceof jwt.TokenExpiredError) {
        console.error('❌ Token has expired')
        return NextResponse.json(
          {
            error: 'Token expired',
            message: 'Your session has expired. Please log in again.',
          },
          { status: 401 },
        )
      }

      if (error instanceof jwt.JsonWebTokenError) {
        console.error('❌ Invalid JWT token format or signature')
        return NextResponse.json(
          {
            error: 'Invalid token',
            message: 'The provided token is invalid',
          },
          { status: 401 },
        )
      }

      console.error('❌ Unknown authentication error')
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
