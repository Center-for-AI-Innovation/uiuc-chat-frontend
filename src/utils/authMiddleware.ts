import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { verifyTokenAsync } from './keycloakClient'
import { getKeycloakBaseFromHost } from '~/utils/authHelpers'
import { AuthenticatedUser } from '~/middleware'

function getTokenFromCookies(req: NextApiRequest): string | null {
  const raw = req.cookies['access_token']
  if (!raw) return null
  return raw
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthenticatedUser
  courseName?: string
}

// Middleware to verify JWT token
export function withAuth(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse,
  ) => Promise<void> | void,
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = getTokenFromCookies(req)

      if (!token) {
        return res.status(401).json({ error: 'Missing token' })
      }

      const rawHost = req.headers['x-forwarded-host'] ?? req.headers['host']
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
      req.user = decoded

      // Call the original handler
      return await handler(req, res)
    } catch (error) {
      console.error('JWT verification error:', error)

      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.',
        })
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid',
        })
      }

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to verify your identity',
      })
    }
  }
}

// Utility function to check if user has specific role
export function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.realm_access?.roles?.includes(role) || false
}

// Utility function to check if user has any of the specified roles
export function hasAnyRole(user: AuthenticatedUser, roles: string[]): boolean {
  return roles.some((role) => hasRole(user, role))
}

// Middleware for role-based access control
export function withRole(requiredRole: string) {
  return function (
    handler: (
      req: AuthenticatedRequest,
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      if (!hasRole(req.user, requiredRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires the '${requiredRole}' role`,
        })
      }

      return await handler(req, res)
    })
  }
}

// Middleware for multiple role access control
export function withAnyRole(requiredRoles: string[]) {
  return function (
    handler: (
      req: AuthenticatedRequest,
      res: NextApiResponse,
    ) => Promise<void> | void,
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      if (!hasAnyRole(req.user, requiredRoles)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
        })
      }

      return await handler(req, res)
    })
  }
}

// Public endpoints that don't require authentication
export const PUBLIC_ENDPOINTS = [
  '/api/healthcheck',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/auth/refresh',
]

// Check if endpoint is public
export function isPublicEndpoint(pathname: string): boolean {
  return PUBLIC_ENDPOINTS.some((endpoint) => pathname.startsWith(endpoint))
}
